use crate::commands::arm_service::{robot_client::RobotClient, structs};
use anyhow::Result;
use chrono::Local;
use tauri::{AppHandle, Emitter}; // ← 这个是关键

use once_cell::sync::OnceCell;

use std::{
    net::UdpSocket,
    sync::{atomic::AtomicBool, Arc, Mutex, RwLock},
    thread,
};

use reqwest::Client;
use serde::{Deserialize, Serialize};

pub static GLOBAL_APP_HANDLE: OnceCell<std::sync::Arc<AppHandle>> = OnceCell::new();

#[derive(Serialize, Clone, Debug)]
pub struct StateData {
    pub server_status: bool,
}
// 定义应用状态结构体

#[derive(Debug)]
pub struct UdpState {
    pub socket: Option<Arc<UdpSocket>>,
    pub handle: Option<thread::JoinHandle<()>>,
    pub stop_flag: Arc<AtomicBool>,
}

#[derive(Debug)]
pub struct RobotServer {
    pub ip: String,
    pub socket: Option<Arc<Mutex<RobotClient>>>,
    pub handle: Option<thread::JoinHandle<Result<(), std::io::Error>>>,
    // 运行状态
    pub observer_running: Arc<AtomicBool>,
    // 连接状态
    pub connected: bool,
    pub observe_params: Arc<RwLock<structs::ObserveParams>>,
    pub stop_flag: Arc<AtomicBool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SharedState {
    pub axis: i32,
    pub ft_sensor: bool,
    pub arm_conn: bool,
}

impl Default for SharedState {
    fn default() -> Self {
        Self {
            axis: 0,
            ft_sensor: false,
            arm_conn: false,
        }
    }
}

#[derive(Debug)]
pub struct AppState {
    // pub user_settings: Mutex<UserSettings>,
    pub app: AppHandle,
    pub state_data: Mutex<StateData>,
    pub udp_state: Mutex<UdpState>,
    pub client: Mutex<Client>,
    pub robot_server: Arc<RwLock<RobotServer>>,
    pub shared_state: Arc<RwLock<SharedState>>,
    // 推送时间 时间戳
    pub push_time: i64,
}

impl AppState {
    pub fn new(app: AppHandle) -> Self {
        Self {
            app: app,
            // user_settings: Mutex::new(UserSettings::default()),
            state_data: Mutex::new(StateData {
                server_status: false,
            }),
            udp_state: Mutex::new(UdpState {
                socket: None,
                handle: None,
                stop_flag: Arc::new(AtomicBool::new(false)),
            }),
            client: Mutex::new(Client::new()),
            robot_server: Arc::new(RwLock::new(RobotServer {
                ip: "".to_string(),
                socket: None,
                handle: None,
                observer_running: Arc::new(AtomicBool::new(false)),
                connected: false,
                observe_params: Arc::new(RwLock::new(structs::ObserveParams::default())),
                stop_flag: Arc::new(AtomicBool::new(false)),
            })),
            shared_state: Arc::new(RwLock::new(SharedState::default())),
            // 推送时间 时间戳
            push_time: Local::now().timestamp_millis(),
        }
    }
    // 推送共享状态到前端
    pub fn push_shared_state(&self) -> Result<SharedState> {
        let shared_state = match self.shared_state.try_read() {
            Ok(shared_state) => shared_state.clone(),
            Err(_) => {
                return Err(anyhow::anyhow!(
                    "Failed to acquire read lock on shared_state"
                ))
            }
        }; // ← 需要 clone 才能脱离锁作用域

        self.app
            .emit("APP_SHARED_STATE", &shared_state)
            .map_err(|op| anyhow::anyhow!("Failed to emit APP_SHARED_STATE event: {:?}", op))?;

        println!("shared_state==>{:?}", shared_state);
        Ok(shared_state)
    }
}

// 获取全局的app 实例
pub fn get_app_handle() -> Result<Arc<AppHandle>> {
    GLOBAL_APP_HANDLE
        .get()
        .cloned()
        .ok_or_else(|| anyhow::anyhow!("Failed to get global app handle"))
}
