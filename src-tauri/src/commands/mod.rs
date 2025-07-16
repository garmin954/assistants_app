use serde_json::Value;

use crate::{state::app_state::AppState, utils::response::Response};

pub mod arm_service;
pub mod request;
pub mod system;
pub mod tools;

#[tauri::command(async)]
pub async fn get_shared_state(
    state: tauri::State<'_, AppState>,
) -> Result<Response<Value>, Response<String>> {
    let r = state
        .push_shared_state()
        .map_err(|e| format!("Failed to push shared state: {:?}", e));

    if let Err(e) = r {
        return Ok(Response::error(e));
    }

    let sd = state.shared_state.read().unwrap().clone();
    let json = serde_json::to_value(sd).unwrap();
    Ok(Response::success(json))
}
