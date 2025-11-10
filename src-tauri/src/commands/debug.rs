// debug.rs - 调试命令
use crate::{state::app_state::AppState, utils::response::Response};
use serde::Serialize;

#[derive(Serialize)]
pub struct UserDataInfo {
    pub root: String,
    pub logs: String,
    pub csv_temp: String,
    pub csv_data: String,
    pub config: String,
}

/// 获取用户数据目录信息 (用于调试)
#[allow(dead_code)]
#[tauri::command]
pub fn get_user_data_paths(state: tauri::State<AppState>) -> Response<UserDataInfo> {
    let paths = &state.user_data_paths;

    let info = UserDataInfo {
        root: paths.root.display().to_string(),
        logs: paths.logs.display().to_string(),
        csv_temp: paths.csv_temp.display().to_string(),
        csv_data: paths.csv_data.display().to_string(),
        config: paths.config.display().to_string(),
    };

    Response::success(info)
}
