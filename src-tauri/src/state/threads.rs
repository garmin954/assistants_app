use std::sync::Arc;

use anyhow::{anyhow, Ok};
use tauri::{AppHandle, Manager};

use crate::{
    commands::arm_service::ws_get::ws_get_data,
    state::app_state::{get_app_handle, AppState, SharedState},
};

pub fn get_state_data(rx: &AppHandle) {
    let app_handle = rx.clone();

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

    let wd = ws_get_data()
        .await
        .map_err(|op| anyhow!("ws_get_data error: {:?}", op))?;

    let shared_state = {
        let mut guard = state.shared_state.write().unwrap();
        guard.axis = wd.axis;
        guard.ft_sensor = wd.ft_sensor;
        guard.clone()
    };

    Ok(shared_state)
}
