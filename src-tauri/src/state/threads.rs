use std::sync::Arc;

use anyhow::{anyhow, Ok};
use tauri::{AppHandle, Manager};

use crate::{
    commands::arm_service::ws_get::ws_get_data,
    state::app_state::{get_app_handle, AppState, SharedState},
};

pub fn get_state_data(_rx: &AppHandle) {
    // let app_handle = rx.clone();

    // thread::spawn(move || loop {
    //     let state = app_handle.state::<AppState>();

    //     let mut push_time = state.push_time;
    //     let now_time = Local::now().timestamp_millis();
    //     println!(
    //         "now_time: {:?}- {:?} = {}",
    //         now_time,
    //         push_time,
    //         now_time - push_time
    //     );
    //     if now_time - push_time > 1000 * 5 {
    //         let _ = state.push_shared_state();
    //         push_time = now_time;
    //     }
    //     thread::sleep(Duration::from_secs(100));
    // });
}

/// 更新数据 并广播  
pub async fn update_shared_state() -> anyhow::Result<SharedState> {
    let app_handle = get_app_handle()?;
    let state = app_handle.state::<AppState>();

    let ws_ip = state.ws_ip.read().unwrap().clone();
    let wd = ws_get_data(ws_ip.as_str())
        .await
        .map_err(|op| anyhow!("ws_get_data error: {:?}", op))?;

    let robot_server = state.robot_server.read().unwrap();
    let shared_state = {
        let mut guard = state.shared_state.write().unwrap();
        guard.axis = wd.axis;
        guard.ft_sensor = wd.ft_sensor;
        guard.arm_conn = robot_server.connected;

        guard.clone()
    };

    Ok(shared_state)
}
