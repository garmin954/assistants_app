mod connection;
mod csv_exporter;
mod parser;
pub mod robot_client;
mod robot_data;
pub mod structs;
pub mod ws_get;

use std::{
    sync::{atomic::Ordering, Arc, Mutex},
    thread,
};

use robot_client::RobotClient;
use serde_json::Value;
use tauri::{Emitter, Manager};

use crate::{
    commands::arm_service::ws_get::{ws_connect_state, ws_get_data},
    result_response,
    state::app_state::{AppState, SharedState},
    utils::response::Response,
};

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
        {
            let mut robot_lock = match state.robot_server.write() {
                Ok(lock) => lock,
                Err(e) => return Err(format!("Failed to acquire robot server lock: {:?}", e)),
            };

            if robot_lock.connected {
                return Ok("Server is already running".to_string());
            }

            *state.ws_ip.write().unwrap() = ip_addr.to_string();
            /********* socket 读取并推送到前端 *********/
            // 配置参数
            let robot_ip = format!("{}:{}", ip_addr, 30000);
            let client = match RobotClient::new(robot_ip) {
                Ok(client) => client,
                Err(e) => return Err(format!("Failed to create RobotClient: {:?}", e)),
            };

            robot_lock.stop_flag.store(false, Ordering::Relaxed);
            // 使用 Arc<Mutex<RobotClient>> 实现线程安全的共享
            let client_arc = Arc::new(Mutex::new(client));
            let client_clone = client_arc.clone();

            let stop_flag = robot_lock.stop_flag.clone();
            let observer_running = robot_lock.observer_running.clone();
            let observe_params = robot_lock.observe_params.clone();

            let ah = app.app_handle().clone();
            let handler = thread::spawn(move || {
                // 从 Arc 中获取客户端
                let mut client = client_clone.lock().unwrap();
                client.collect_data(stop_flag, observer_running, observe_params, |rp| {
                    // 发送事件
                    if let Ok(packet) = rp {
                        let _ = ah.emit("robot-data", &packet);
                    } else {
                        eprintln!("Failed to collect data:{:?}", rp.unwrap_err());
                    }
                    Ok(())
                })
            });
            robot_lock.ip = ip_addr.to_string();
            robot_lock.connected = true;
            robot_lock.socket = Some(client_arc);
            robot_lock.handle = Some(handler);
        }

        /*************************** 读取并更新shared_state *************************** */
        let mut shared_state = state.shared_state.clone().read().unwrap().clone();
        let wd = ws_get_data(ip_addr)
            .await
            .map_err(|e| format!("Failed to update shared state: {:?}", e))?;

        shared_state.arm_conn = true;
        shared_state.axis = wd.axis;
        shared_state.ft_sensor = wd.ft_sensor;
        shared_state.observering = false;

        if let Err(e) = state.set_shared_state(shared_state) {
            return Err(format!("Failed to update shared state: {:?}", e));
        };

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
        let mut robot_lock = state
            .robot_server
            .write()
            .map_err(|_| "Failed to acquire lock".to_string())?;

        if !robot_lock.connected {
            return Err("Server is not running".to_string());
        }

        robot_lock.stop_flag.store(true, Ordering::Relaxed);
        std::thread::sleep(std::time::Duration::from_millis(100));

        if let Some(client_arc) = robot_lock.socket.take() {
            let mut client = client_arc
                .lock()
                .map_err(|_| "Failed to acquire client lock".to_string())?;
            client
                .disconnect()
                .map_err(|e| format!("Failed to disconnect: {}", e))?;

            if let Some(handler) = robot_lock.handle.take() {
                // 这里忽略线程的返回值，仅关注线程是否成功 join
                let _ = handler.join();
            }

            robot_lock.socket = None;
            robot_lock.connected = false;

            /*************************** 读取并更新shared_state *************************** */
            let shared_state = SharedState::default();
            if let Err(e) = state.set_shared_state(shared_state) {
                return Err(format!("Failed to update shared state: {:?}", e));
            };

            state
                .push_shared_state()
                .map_err(|e| format!("Failed to push shared state: {:?}", e))?;

            Ok("Robot server disconnected successfully".to_string())
        } else {
            Err("Failed to acquire client lock".to_string())
        }
    };

    result_response!(result().await)
}

#[tauri::command]
pub fn start_assistant(
    state: tauri::State<AppState>,
    params: structs::ObserveParams,
) -> Response<String> {
    let robot_lock = match state.robot_server.write() {
        Ok(lock) => lock,
        Err(_) => return Response::error("Failed to acquire lock"),
    };

    if !robot_lock.connected {
        return Response::error("Server is not running");
    }

    if robot_lock.observer_running.load(Ordering::Relaxed) {
        return Response::error("Assistant is already running");
    }

    robot_lock.observer_running.store(true, Ordering::Relaxed);

    let mut params_write = match robot_lock.observe_params.write() {
        Ok(write) => write,
        Err(_) => return Response::error("Failed to acquire lock"),
    };

    *params_write = params;

    /*************************** 读取并更新shared_state *************************** */
    let mut shared_state = state.shared_state.clone().read().unwrap().clone();
    shared_state.observering = true;

    state.set_shared_state(shared_state).unwrap();
    state.push_shared_state().unwrap();

    Response::success("Assistant started successfully".to_string())
}

#[tauri::command]
pub fn stop_assistant(state: tauri::State<AppState>) -> Response<String> {
    let robot_lock = match state.robot_server.write() {
        Ok(lock) => lock,
        Err(_) => return Response::error("Failed to acquire lock"),
    };

    if !robot_lock.connected {
        return Response::error("Server is not running");
    }

    if !robot_lock.observer_running.load(Ordering::Relaxed) {
        return Response::error("Assistant is not running");
    }

    robot_lock.observer_running.store(false, Ordering::Relaxed);

    /*************************** 读取并更新shared_state *************************** */
    let mut shared_state = state.shared_state.clone().read().unwrap().clone();
    shared_state.observering = false;

    state.set_shared_state(shared_state).unwrap();
    state.push_shared_state().unwrap();

    Response::success("Assistant stopped successfully".to_string())
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
