use std::{
    net::UdpSocket,
    sync::{atomic::AtomicBool, Arc, Mutex},
    thread,
};

use reqwest::Client;
use serde::Serialize;

#[derive(Serialize, Clone, Debug)]
pub struct StateData {
    pub server_status: bool,
}
// 定义应用状态结构体

pub struct UdpState {
    pub socket: Option<Arc<UdpSocket>>,
    pub handle: Option<thread::JoinHandle<()>>,
    pub stop_flag: Arc<AtomicBool>,
}
pub struct AppState {
    // pub user_settings: Mutex<UserSettings>,
    pub state_data: Mutex<StateData>,
    pub udp_state: Mutex<UdpState>,
    pub client: Mutex<Client>,
}

// 定义用户设置结构体
// pub struct UserSettings {
//     pub theme: String,       // 应用主题 (如 "dark" 或 "light")
//     pub language: String,    // 应用语言 (如 "en" 或 "zh")
//     pub notifications: bool, // 是否启用通知
// }

// impl Default for UserSettings {
//     fn default() -> Self {
//         UserSettings {
//             theme: "light".to_string(),
//             language: "en".to_string(),
//             notifications: true,
//         }
//     }
// }

// 创建一个新的 AppState 实例
impl AppState {
    pub fn new() -> Self {
        AppState {
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
        }
    }
}

// 用于前端调用的命令，获取用户设置
// #[tauri::command]
// pub fn get_user_settings(state: State<'_, AppState>) -> UserSettings {
//     state.user_settings.lock().unwrap().clone()
// }

// 用于前端调用的命令，更新用户设置
// #[tauri::command]
// pub fn update_user_settings(
//     state: State<'_, AppState>,
//     theme: String,
//     language: String,
//     notifications: bool,
// ) {
//     let mut settings = state.user_settings.lock().unwrap();
//     settings.theme = theme;
//     settings.language = language;
//     settings.notifications = notifications;
// }
