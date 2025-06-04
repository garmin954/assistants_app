use crate::state::app_state::AppState;
use crate::utils::process_manage::{is_process_running, kill_process};
use crate::utils::system::{
    app_path_join, is_executable_file, open_server, remove_extended_path_prefix,
};
use regex::Regex;
use semver::Version;
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::Path;
use std::sync::atomic::Ordering;
use std::time::Duration;
use tauri::Manager;

use std::process::Command;
use sysinfo::System;

use log::{error, info};
use std::net::{SocketAddr, UdpSocket};
use std::sync::Arc;
use std::thread::{self, sleep};
use tauri::Emitter;
use tauri::{AppHandle, Runtime, Window};

#[tauri::command]
pub async fn app_exit<R: tauri::Runtime>(app: tauri::AppHandle<R>) {
    app.exit(0);
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SystemInfo {
    pub os_name: String,
    // pub os_version: String,
    pub os_arch: String,
    pub cpu_name: String,
    pub total_mem: u64,
    pub tauri_version: String,
    pub gpu_name: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PowershellGPUOutput {
    #[serde(rename = "Name")]
    pub name: String,
}

#[tauri::command]
pub fn system_info() -> SystemInfo {
    let mut sys = System::new_all();
    sys.refresh_all();

    let mut os_name = System::name().unwrap_or(String::from("N/A"));
    // let os_version = tauri_plugin_os::version().to_string();
    let tauri_version = tauri::VERSION.to_string();
    let mut os_arch = env::consts::ARCH.to_string();
    let cpu_name = sys.cpus()[0].brand().to_string();
    let total_mem = sys.total_memory();

    let gpu_name_json = if let Ok(output) = Command::new("powershell")
    .args(&[
        "-NoProfile",
        "-Command",
        "Get-CimInstance -ClassName Win32_VideoController | Select-Object Name | ConvertTo-Json",
    ])
    .output()
    {
        if output.status.success() {
            String::from_utf8_lossy(&output.stdout).to_string()
        } else {
            String::from("N/A")
        }
    } else {
        String::from("N/A")
    };

    let gpu_name = match serde_json::from_str::<PowershellGPUOutput>(&gpu_name_json) {
        Ok(parsed) => parsed.name,
        Err(_) => "N/A".to_string(),
    };

    os_name = match os_name.as_str() {
        "Darwin" => "macOS".to_string(),
        _ => os_name,
    };

    os_arch = match os_arch.as_str() {
        "x86_64" => "x64".to_string(),
        "aarch64" => "arm64".to_string(),
        _ => os_arch,
    };

    let res = SystemInfo {
        os_name,
        // os_version,
        cpu_name,
        total_mem,
        os_arch,
        tauri_version,
        gpu_name,
    };

    res.into()
}

pub const SERVER_NAME: &str = "xarmparam";

#[tauri::command]
pub async fn quit_server() -> Result<(), String> {
    match kill_process(SERVER_NAME) {
        Ok(_) => {
            println!("Process killed successfully.");
            Ok(())
        }
        Err(e) => {
            eprintln!("Failed to kill process: {:?}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn start_server<R: tauri::Runtime>(app: tauri::AppHandle<R>) -> String {
    // let sidecar_command = app.shell().sidecar(SERVER_NAME).unwrap();
    // let (mut rx, mut _child) = sidecar_command.spawn().expect("Failed to spawn sidecar");

    // tauri::async_runtime::spawn(async move {
    //     // 读取诸如 stdout 之类的事件
    //     while let Some(event) = rx.recv().await {
    //         if let CommandEvent::Stdout(line) = event {
    //             // log::info!("Application started!{:?}", line);
    //         }
    //     }
    // });
    // return "0".to_string();
    let app_path = app_path_join(app).expect("Failed to get resource directory");

    let r = open_server(app_path, SERVER_NAME);

    match r {
        Some(child) => {
            let pid = child.id().to_string();
            return pid;
        }
        None => {
            log::error!("{} 程序文件不存在", SERVER_NAME);
            return "0".to_string();
        }
    }

    // let command = Path::new(SERVER_NAME);
    // let server_path = relative_command_path(command).unwrap();

    // let child = Command::new(server_path)
    //     .creation_flags(0x8000000)
    //     .spawn()
    //     .expect("Failed to start process");

    // let pid = child.id().to_string();
}

#[tauri::command]
pub fn get_server_state() -> bool {
    is_process_running(SERVER_NAME)
}

#[tauri::command]

pub fn find_latest_firmware<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    folder_path: &str,
    prefix: &str,
) -> Result<Option<String>, String> {
    let app_path = app_path_join(app).expect("Failed to get resource directory");
    let folder = app_path.join(folder_path);
    // 读取目标文件夹中的所有文件
    let entries = match fs::read_dir(folder) {
        Ok(entries) => entries,
        Err(e) => return Err(format!("Error reading directory: {}", e)),
    };

    // 正则表达式匹配版本号，假设版本号的格式是 "数字.数字.数字"
    let version_regex = Regex::new(r"\d+\.\d+\.\d+").unwrap();

    // 存储匹配的文件的完整路径
    let mut matched_files = Vec::new();

    // 遍历所有文件
    for entry in entries {
        let entry = match entry {
            Ok(e) => e,
            Err(e) => return Err(format!("Error reading entry: {}", e)),
        };
        let file_name = entry.file_name().into_string().unwrap();

        // 判断文件名是否以指定的前缀开头
        if file_name.starts_with(prefix) {
            matched_files.push(entry.path());
        }
    }

    // 如果没有找到任何匹配的文件
    if matched_files.is_empty() {
        return Ok(None);
    }

    // 如果只有一个匹配文件，直接返回
    if matched_files.len() == 1 {
        let path_str = matched_files[0].to_string_lossy().to_string();
        let clean_path = remove_extended_path_prefix(&path_str).to_string();
        return Ok(Some(clean_path));
    }

    // 如果有多个匹配文件，找出版本号最新的文件
    let mut latest_version = None;
    let mut latest_file = None;

    for file_path in matched_files {
        let file_name = file_path.file_name().unwrap().to_string_lossy();

        // 使用正则表达式提取版本号
        if let Some(captures) = version_regex.captures(&file_name) {
            let version_str = captures.get(0).unwrap().as_str();

            // 解析版本号
            if let Ok(version) = Version::parse(version_str) {
                match &latest_version {
                    Some(latest) if latest < &version => {
                        latest_version = Some(version);
                        latest_file = Some(file_path.clone());
                    }
                    None => {
                        latest_version = Some(version);
                        latest_file = Some(file_path.clone());
                    }
                    _ => {}
                }
            }
        }
    }

    // 返回最新版本的文件的完整路径
    let result = latest_file.map(|path| {
        let path_str = path.to_string_lossy().to_string();
        let clean_path = remove_extended_path_prefix(&path_str).to_string();
        clean_path
    });

    Ok(result)
}

#[tauri::command]

pub fn open_studio_window<R: tauri::Runtime>(app: tauri::AppHandle<R>, ip: String, lang: String) {
    println!("Opening studio window...");

    tauri::async_runtime::spawn(async move {
        if let Some(webview_window) = app.get_webview_window("studio") {
            // 修改窗口地址
            let new_url = format!("/studio?ip={}&lang={}", ip, lang); // 根据 IP 构造新的 URL
            if let Err(e) = webview_window.eval(&format!("window.location.href = '{}';", new_url)) {
                eprintln!("Failed to change window location: {}", e);
            }

            let _ = webview_window.unminimize();
            let _ = webview_window.show();
            let _ = webview_window.set_focus();
        }
    });
}

#[derive(Serialize, Clone)]
struct ArmIpIntro {
    ip: String,
    port: String,
    axis: String,
    device_type: String,
    version: String,
    arm_sn: String,
    control_sn: String,
}
#[tauri::command]
pub fn start_udp_broadcast<R: Runtime>(app: AppHandle<R>, window: Window<R>) -> Result<(), String> {
    let _ = window.emit("xarm_ip", "begin");
    let state = app.state::<AppState>();
    let mut udp_state = state.udp_state.lock().map_err(|e| e.to_string())?;

    // 如果已经开启，直接返回
    if udp_state.socket.is_some() {
        return Err("UDP broadcast is already running".to_string());
    }

    // 绑定到本地地址和端口
    let socket = UdpSocket::bind("0.0.0.0:0").map_err(|e| e.to_string())?;
    socket.set_broadcast(true).map_err(|e| e.to_string())?;

    // 设置 socket 为非阻塞模式，设置超时时间
    socket
        .set_read_timeout(Some(Duration::from_millis(500)))
        .map_err(|e| e.to_string())?;

    // 克隆 socket 用于线程
    let socket = Arc::new(socket);
    let socket_clone = Arc::clone(&socket);

    // 广播地址和端口
    let broadcast_addr = "255.255.255.255:18355";
    let message = "get_xarm_addr";

    // 发送广播消息
    socket
        .send_to(message.as_bytes(), broadcast_addr)
        .map_err(|e| e.to_string())?;

    // 启动线程接收回复
    let stop_flag = Arc::clone(&udp_state.stop_flag);
    let handle = thread::spawn(move || {
        let mut buf = [0; 1024];
        loop {
            // 检查标志位
            if stop_flag.load(Ordering::SeqCst) {
                info!("Stopping UDP broadcast...");
                break;
            }

            match socket_clone.recv_from(&mut buf) {
                Ok((amt, src)) => {
                    let received_data = String::from_utf8_lossy(&buf[..amt]);
                    info!("Received from {}: {}", src, received_data);

                    match parse_received_data(&received_data, &src) {
                        Ok(arm_ip_intro) => {
                            if let Err(e) = window.emit("xarm_ip", arm_ip_intro) {
                                error!("Failed to emit event: {}", e);
                            }
                        }
                        Err(e) => {
                            error!("parse_received_data: {}", e);
                        }
                    }
                }
                Err(e) => {
                    // 如果是超时错误，继续循环
                    if e.kind() == std::io::ErrorKind::WouldBlock {
                        sleep(Duration::from_millis(10)); // 短暂睡眠，减少 CPU 占用
                        continue;
                    }
                    // 如果 socket 被关闭，recv_from 会返回错误
                    if stop_flag.load(Ordering::SeqCst) {
                        break; // 正常退出
                    }
                    error!("Error receiving data: {}", e);
                    break;
                }
            }
        }
    });

    // 更新状态
    udp_state.socket = Some(socket);
    udp_state.handle = Some(handle);

    info!("UDP broadcast started");
    Ok(())
}

/// 解析接收到的数据
fn parse_received_data(data: &str, src: &SocketAddr) -> Result<ArmIpIntro, String> {
    let src_string = src.to_string();
    let addr: Vec<&str> = src_string.split(':').collect();
    if addr.len() != 2 {
        return Err("Invalid source address format".to_string());
    }

    let parts: Vec<&str> = data.split(':').collect();

    if parts.len() != 3 {
        return Err("Invalid received data format".to_string());
    }

    let intro: Vec<&str> = parts[1].split(',').collect();
    if intro.len() != 5 {
        return Err("Invalid intro format".to_string());
    }

    Ok(ArmIpIntro {
        ip: addr[0].to_string(),
        port: addr[1].to_string(),
        axis: intro[0].to_string(),
        device_type: intro[1].to_string(),
        arm_sn: intro[2].trim().to_string(),
        control_sn: intro[3].trim().to_string(),
        version: intro[4].to_string(),
    })
}

// 关闭 UDP 广播
#[tauri::command]
pub fn stop_udp_broadcast<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    info!("UDP broadcast stop!");

    let state = app.state::<AppState>();
    let mut udp_state = state.udp_state.lock().map_err(|e| e.to_string())?;

    // 如果没有开启，直接返回
    if udp_state.socket.is_none() {
        return Err("UDP broadcast is not running".to_string());
    }

    // 设置标志位，通知线程退出
    udp_state.stop_flag.store(true, Ordering::SeqCst);

    // 关闭 socket，唤醒阻塞的 recv_from
    if let Some(socket) = udp_state.socket.take() {
        drop(socket);
    }

    // 等待线程退出
    if let Some(handle) = udp_state.handle.take() {
        if let Err(e) = handle.join() {
            error!("Failed to join thread: {:?}", e);
        }
    }

    // 重置状态
    udp_state.stop_flag.store(false, Ordering::SeqCst);

    info!("UDP broadcast stopped");
    Ok(())
}

// 升级后端服务

#[tauri::command]
pub fn updater_service<R: Runtime>(app: AppHandle<R>, path: String) -> Result<String, String> {
    let file_path = Path::new(&path);
    let root_path = app_path_join(app).map_err(|e| e.to_string())?;

    if !file_path.exists() {
        return Err(format!("Error reading file: 文件不存在！",));
    }

    // 检查是否为可执行文件
    if is_executable_file(file_path) == false {
        return Err(format!("Error reading file: 文件不是可执行文件！",));
    }

    log::info!("升级后端服务");
    log::info!("提交的后端服务文件路径：{}", file_path.to_string_lossy());
    log::info!("app_path 应用安装路径：{}", root_path.to_string_lossy());
    // 先停止服务
    match kill_process(SERVER_NAME) {
        Ok(_) => {
            log::info!("Process killed successfully.");
        }
        Err(e) => {
            log::error!("Failed to kill process: {:?}", e);
        }
    }
    log::info!("结束 {} 进程...", SERVER_NAME);

    #[cfg(windows)]
    let server_name = format!("{}.exe", SERVER_NAME);
    #[cfg(not(windows))]
    let server_name = SERVER_NAME;

    let server_path = root_path.join(server_name);
    log::info!("修改服务文件明（bak）");
    if let Err(e) = fs::rename(&server_path, server_path.with_extension("bak")) {
        log::error!("Failed to rename server file: {:?}", e);
    }

    log::info!("替换服务文件");
    let _ = fs::copy(&file_path, &server_path);

    log::info!("打开{}进程", SERVER_NAME);
    let _ = open_server(root_path, SERVER_NAME).unwrap();

    log::info!("后端服务升级成功");
    Ok("success".to_string())
}
