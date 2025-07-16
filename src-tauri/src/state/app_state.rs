use crate::commands::arm_service::{robot_client::RobotClient, structs, ws_get::ws_get_data};
use anyhow::{anyhow, Result};
use tauri::{AppHandle, Emitter, Manager}; // ← 这个是关键

use once_cell::sync::OnceCell;

use std::{
    net::UdpSocket,
    sync::{atomic::AtomicBool, Arc, Mutex, RwLock},
    thread,
};

use reqwest::Client;
use serde::{Deserialize, Serialize};

pub static GLOBAL_APP_HANDLE: OnceCell<std::sync::Arc<AppHandle<tauri::Wry>>> = OnceCell::new();

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
    pub observering: bool,
}

impl Default for SharedState {
    fn default() -> Self {
        Self {
            axis: 0,
            ft_sensor: false,
            arm_conn: false,
            observering: false,
        }
    }
}

#[derive(Debug)]
pub struct AppState {
    // pub user_settings: Mutex<UserSettings>,
    pub ws_ip: Arc<RwLock<String>>,
    pub app: AppHandle,
    pub udp_state: Mutex<UdpState>,
    pub client: Mutex<Client>,
    pub robot_server: Arc<RwLock<RobotServer>>,
    pub shared_state: Arc<RwLock<SharedState>>,
}

impl AppState {
    pub fn new(app: AppHandle) -> Self {
        Self {
            ws_ip: Arc::new(RwLock::new("".to_string())),
            app: app,
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
        }
    }
    /// 推送共享状态到前端
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

        Ok(shared_state)
    }

    /// 设置共享状态
    pub fn set_shared_state(&self, state: SharedState) -> anyhow::Result<()> {
        let mut shared_state = self
            .shared_state
            .write()
            .map_err(|_| anyhow::anyhow!("Failed to acquire write lock on shared_state"))?;

        *shared_state = state;
        Ok(())
    }
}

// 获取全局的app 实例
pub fn get_app_handle() -> Result<Arc<AppHandle<tauri::Wry>>> {
    GLOBAL_APP_HANDLE
        .get()
        .cloned()
        .ok_or_else(|| anyhow::anyhow!("Failed to get global app handle"))
}
