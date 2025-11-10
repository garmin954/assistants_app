mod connection;
pub mod csv_exporter;
mod parser;
pub mod robot_client;
mod robot_data;
pub mod structs;
pub mod ws_get;

use std::{
    path::PathBuf,
    sync::{atomic::Ordering, Arc, Mutex},
    thread,
    time::Duration,
};

use robot_client::RobotClient;
use serde_json::Value;
use tauri::{Emitter, Manager};

use crate::{
    commands::arm_service::{
        csv_exporter::CsvExporter,
        ws_get::{ws_connect_state, ws_get_data},
    },
    result_response,
    state::app_state::{AppState, SharedState},
    utils::response::Response,
};

// 机械臂TCP端口
const ROBOT_PORT: u16 = 30000;
// 断开连接延迟时间 s
const DISCONNECT_DELAY_MS: u64 = 100;
// 观察者检查间隔时间
const OBSERVER_CHECK_INTERVAL_MS: u64 = 200;

#[tauri::command(async)]
pub async fn connect_robot_server<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    state: tauri::State<'_, AppState>,
    ip_addr: &str,
) -> Result<Response<String>, Response<String>> {
    if !ws_connect_state(ip_addr).await {
        return Ok(Response::error("ws连接失败"));
    }

    let result = async || {
        // 首先检查连接状态
        {
            let robot_lock = state
                .robot_server
                .read()
                .map_err(|e| format!("Failed to acquire robot server read lock: {:?}", e))?;

            if robot_lock.connected {
                return Ok("Server is already running".to_string());
            }
        }

        // 更新 ws_ip (单独获取锁)
        *state
            .ws_ip
            .write()
            .map_err(|e| format!("Failed to acquire ws_ip lock: {:?}", e))? = ip_addr.to_string();

        /********* socket 读取并推送到前端 *********/
        // 配置参数
        let robot_ip = format!("{}:{}", ip_addr, ROBOT_PORT);
        let client = RobotClient::new(robot_ip)
            .map_err(|e| format!("Failed to create RobotClient: {:?}", e))?;

        /*************************************** 初始化csv导出器 *********************/
        // 先获取 robot_lock 来访问 csv_exporter
        let csv_exporter_arc = {
            let robot_lock = state
                .robot_server
                .read()
                .map_err(|e| format!("Failed to acquire robot server read lock: {:?}", e))?;
            robot_lock.csv_exporter.clone()
        };

        // 单独初始化 csv_exporter (避免嵌套锁)
        {
            let mut csv_exporter = csv_exporter_arc
                .write()
                .map_err(|e| format!("Failed to acquire csv_exporter lock: {:?}", e))?;

            let exporter = CsvExporter::new()
                .map_err(|e| format!("Failed to create CSV exporter: {:?}", e))?;

            *csv_exporter = Some(exporter);
        }

        // 获取所有需要的 Arc 克隆
        let (stop_flag, observer_running, observe_params, csv_exporter) = {
            let robot_lock = state
                .robot_server
                .read()
                .map_err(|e| format!("Failed to acquire robot server read lock: {:?}", e))?;

            (
                robot_lock.stop_flag.clone(),
                robot_lock.observer_running.clone(),
                robot_lock.observe_params.clone(),
                robot_lock.csv_exporter.clone(),
            )
        };

        // 使用 Arc<Mutex<RobotClient>> 实现线程安全的共享
        let client_arc = Arc::new(Mutex::new(client));
        let client_clone = client_arc.clone();

        stop_flag.store(false, Ordering::Relaxed);

        let ah = app.app_handle().clone();
        let handler = thread::spawn(move || {
            // 从 Arc 中获取客户端
            let mut client = client_clone
                .lock()
                .expect("Failed to lock RobotClient in data collection thread");
            client.collect_data(stop_flag, observer_running, observe_params, |rp| {
                // 发送事件
                if let Ok(packet) = rp {
                    let _ = ah.emit("ROBOT_TCP_DATA", &packet.data);
                    // 写入csv文件
                    if packet.csv {
                        if let Ok(mut csv_exporter_guard) = csv_exporter.write() {
                            if let Some(csv_exporter) = csv_exporter_guard.as_mut() {
                                if let Err(e) = csv_exporter.write_packet(&packet.data) {
                                    eprintln!("Failed to write packet to CSV: {:?}", e);
                                }
                            }
                        }
                    }
                } else if let Err(e) = rp {
                    eprintln!("Failed to collect data: {:?}", e);
                }
                Ok(())
            })
        });

        // 最后更新 robot_lock 状态
        {
            let mut robot_lock = state
                .robot_server
                .write()
                .map_err(|e| format!("Failed to acquire robot server write lock: {:?}", e))?;

            robot_lock.ip = ip_addr.to_string();
            robot_lock.connected = true;
            robot_lock.socket = Some(client_arc);
            robot_lock.handle = Some(handler);
        }

        /*************************** 读取并更新shared_state *************************** */
        let wd = ws_get_data(ip_addr)
            .await
            .map_err(|e| format!("Failed to get ws data: {:?}", e))?;

        let mut shared_state = state
            .shared_state
            .read()
            .map_err(|e| format!("Failed to acquire shared_state read lock: {:?}", e))?
            .clone();

        shared_state.arm_conn = true;
        shared_state.axis = wd.axis;
        shared_state.ft_sensor = wd.ft_sensor;
        shared_state.observering = false;

        state
            .set_shared_state(shared_state)
            .map_err(|e| format!("Failed to update shared state: {:?}", e))?;

        state
            .push_shared_state()
            .map_err(|e| format!("Failed to push shared state: {:?}", e))?;

        Ok("Robot server connected successfully".to_string())
    };

    result_response!(result().await)
}

#[tauri::command(async)]
pub async fn disconnect_robot_server(
    state: tauri::State<'_, AppState>,
) -> Result<Response<String>, Response<String>> {
    let result = async || {
        // 先检查连接状态
        {
            let robot_lock = state
                .robot_server
                .read()
                .map_err(|e| format!("Failed to acquire robot server read lock: {:?}", e))?;

            if !robot_lock.connected {
                return Err("Server is not running".to_string());
            }
        }

        // 设置停止标志
        {
            let robot_lock = state
                .robot_server
                .read()
                .map_err(|e| format!("Failed to acquire robot server read lock: {:?}", e))?;

            robot_lock.stop_flag.store(true, Ordering::Relaxed);
            robot_lock.observer_running.store(false, Ordering::Relaxed);
        }

        // 短暂等待线程响应停止信号
        thread::sleep(Duration::from_millis(DISCONNECT_DELAY_MS));

        // 断开连接并清理资源
        let mut robot_lock = state
            .robot_server
            .write()
            .map_err(|e| format!("Failed to acquire robot server write lock: {:?}", e))?;

        let client_arc = robot_lock
            .socket
            .take()
            .ok_or_else(|| "No active client connection".to_string())?;

        let mut client = client_arc
            .lock()
            .map_err(|e| format!("Failed to acquire client lock: {:?}", e))?;

        client
            .disconnect()
            .map_err(|e| format!("Failed to disconnect: {}", e))?;

        // 等待数据收集线程结束
        if let Some(handler) = robot_lock.handle.take() {
            drop(client); // 释放 client 锁,避免死锁
            drop(robot_lock); // 释放 robot_lock,避免死锁

            // 等待线程结束
            let _ = handler
                .join()
                .map_err(|_| "Failed to join data collection thread".to_string())?;

            // 重新获取锁以更新状态
            robot_lock = state
                .robot_server
                .write()
                .map_err(|e| format!("Failed to reacquire robot server write lock: {:?}", e))?;
        }

        robot_lock.socket = None;
        robot_lock.connected = false;

        // 清理 csv_exporter (避免在持有 robot_lock 时获取嵌套锁)
        let csv_exporter_arc = robot_lock.csv_exporter.clone();
        drop(robot_lock); // 释放 robot_lock

        {
            let mut csv_exporter_rw = csv_exporter_arc
                .write()
                .map_err(|e| format!("Failed to acquire csv_exporter lock: {:?}", e))?;

            if let Some(csv_exporter) = csv_exporter_rw.as_mut() {
                csv_exporter
                    .delete()
                    .map_err(|e| format!("Failed to clear temp file: {:?}", e))?;
            }
            *csv_exporter_rw = None;
        }

        /*************************** 读取并更新shared_state *************************** */
        let shared_state = SharedState::default();
        state
            .set_shared_state(shared_state)
            .map_err(|e| format!("Failed to update shared state: {:?}", e))?;

        state
            .push_shared_state()
            .map_err(|e| format!("Failed to push shared state: {:?}", e))?;

        Ok("Robot server disconnected successfully".to_string())
    };

    result_response!(result().await)
}

#[tauri::command]
pub fn start_assistant<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    state: tauri::State<AppState>,
    params: structs::ObserveParams,
) -> Response<String> {
    // 先检查连接状态和运行状态
    {
        let robot_lock = match state.robot_server.read() {
            Ok(lock) => lock,
            Err(e) => {
                return Response::error(format!(
                    "Failed to acquire robot server read lock: {:?}",
                    e
                ))
            }
        };

        if !robot_lock.connected {
            return Response::error("Server is not running");
        }

        if robot_lock.observer_running.load(Ordering::Relaxed) {
            return Response::error("Assistant is already running");
        }
    }

    // 初始化 csv_exporter (避免嵌套锁)
    let csv_exporter_arc = {
        let robot_lock = match state.robot_server.read() {
            Ok(lock) => lock,
            Err(e) => {
                return Response::error(format!(
                    "Failed to acquire robot server read lock: {:?}",
                    e
                ))
            }
        };
        robot_lock.csv_exporter.clone()
    };

    {
        let mut csv_exporter_rw = match csv_exporter_arc.write() {
            Ok(guard) => guard,
            Err(e) => {
                return Response::error(format!("Failed to acquire csv_exporter lock: {:?}", e))
            }
        };

        if let Some(csv_exporter) = csv_exporter_rw.as_mut() {
            if let Err(e) = csv_exporter.create() {
                return Response::error(format!("Failed to create temp file: {:?}", e));
            }
        }
    }

    // 更新 observer_running 和 observe_params
    let observer_running = {
        let robot_lock = match state.robot_server.read() {
            Ok(lock) => lock,
            Err(e) => {
                return Response::error(format!(
                    "Failed to acquire robot server read lock: {:?}",
                    e
                ))
            }
        };

        robot_lock.observer_running.store(true, Ordering::Relaxed);

        let mut params_write = match robot_lock.observe_params.write() {
            Ok(write) => write,
            Err(e) => {
                return Response::error(format!("Failed to acquire observe_params lock: {:?}", e))
            }
        };

        *params_write = params.clone();

        robot_lock.observer_running.clone()
    };

    /*************************** 读取并更新shared_state *************************** */
    {
        let mut shared_state = match state.shared_state.read() {
            Ok(guard) => guard.clone(),
            Err(e) => {
                return Response::error(format!(
                    "Failed to acquire shared_state read lock: {:?}",
                    e
                ))
            }
        };

        shared_state.observering = true;

        if let Err(e) = state.set_shared_state(shared_state) {
            return Response::error(format!("Failed to set shared_state: {:?}", e));
        }

        if let Err(e) = state.push_shared_state() {
            return Response::error(format!("Failed to push shared_state: {:?}", e));
        }
    }

    /*************** 在后台线程中，timeout秒后将 observering = false 并更新状态 ***************/
    let timeout_millis = params.timeout * 1000;
    let app_handle = app.app_handle().clone();

    thread::spawn(move || {
        // 将长时间睡眠改为循环短睡眠并检查退出标志
        let mut remaining_millis = timeout_millis as i64;
        while remaining_millis > 0 && observer_running.load(Ordering::Relaxed) {
            thread::sleep(Duration::from_millis(OBSERVER_CHECK_INTERVAL_MS));
            remaining_millis -= OBSERVER_CHECK_INTERVAL_MS as i64;
        }

        // 超时或被取消后都需要更新状态
        let state = app_handle.state::<AppState>();

        observer_running.store(false, Ordering::Relaxed);

        // 使用分号确保临时值在作用域结束前被清理
        if let Ok(guard) = state.shared_state.read() {
            let mut shared_state = guard.clone();
            drop(guard); // 显式释放读锁

            shared_state.observering = false;
            let _ = state.set_shared_state(shared_state);
            let _ = state.push_shared_state();
        };
    });

    Response::success("Assistant started successfully".to_string())
}

#[tauri::command]
pub fn stop_assistant(state: tauri::State<AppState>) -> Response<String> {
    // 检查连接状态和运行状态,并停止 observer
    {
        let robot_lock = match state.robot_server.read() {
            Ok(lock) => lock,
            Err(e) => {
                return Response::error(format!(
                    "Failed to acquire robot server read lock: {:?}",
                    e
                ))
            }
        };

        if !robot_lock.connected {
            return Response::error("Server is not running");
        }

        if !robot_lock.observer_running.load(Ordering::Relaxed) {
            return Response::error("Assistant is not running");
        }

        robot_lock.observer_running.store(false, Ordering::Relaxed);
    }

    /*************************** 读取并更新shared_state *************************** */
    {
        let mut shared_state = match state.shared_state.read() {
            Ok(guard) => guard.clone(),
            Err(e) => {
                return Response::error(format!(
                    "Failed to acquire shared_state read lock: {:?}",
                    e
                ))
            }
        };

        shared_state.observering = false;

        if let Err(e) = state.set_shared_state(shared_state) {
            return Response::error(format!("Failed to set shared_state: {:?}", e));
        }

        if let Err(e) = state.push_shared_state() {
            return Response::error(format!("Failed to push shared_state: {:?}", e));
        }
    }

    Response::success("Assistant stopped successfully".to_string())
}

#[tauri::command]
pub fn save_csv(state: tauri::State<AppState>, path: &str) -> Response<String> {
    // 获取 csv_exporter_arc (避免持有 robot_lock)
    let csv_exporter_arc = {
        let robot_lock = match state.robot_server.read() {
            Ok(lock) => lock,
            Err(e) => {
                return Response::error(format!(
                    "[save_csv]Failed to acquire robot_server lock: {:?}",
                    e
                ))
            }
        };

        // 检查连接状态
        if !robot_lock.connected {
            return Response::error("请先连接机器人服务器");
        }

        robot_lock.csv_exporter.clone()
    };

    // 保存 CSV 文件
    let mut csv_exporter_guard = match csv_exporter_arc.write() {
        Ok(guard) => guard,
        Err(e) => {
            return Response::error(format!(
                "[save_csv]Failed to acquire csv_exporter lock: {:?}",
                e
            ))
        }
    };

    match csv_exporter_guard.as_mut() {
        Some(csv_exporter) => {
            if let Err(e) = csv_exporter.save_to(&PathBuf::from(path)) {
                return Response::error(format!("Failed to save csv: {:?}", e));
            }
        }
        None => {
            return Response::error("[save_csv]CSV exporter not initialized");
        }
    }

    Response::success("Save csv successfully".to_string())
}

#[tauri::command(async)]
pub async fn get_robot_axis(
    state: tauri::State<'_, AppState>,
) -> Result<Response<Value>, Response<String>> {
    let ws_ip = state.ws_ip.read().unwrap().clone();
    let sdk_data = ws_get_data(ws_ip.as_str()).await;
    if let Ok(data) = sdk_data {
        let json = serde_json::to_value(data).unwrap();
        return Ok(Response::success(json));
    }
    Ok(Response::error("Failed to get robot axis"))
}
