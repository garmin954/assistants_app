use crate::state::app_state::AppState;
use serde::Deserialize;
use serde::Serialize;

// 定义数据结构（根据 JSON 响应调整）
#[derive(Debug, Deserialize)]
pub struct Release {
    // pub version: String,
    pub notes: String,
    // pub pub_date: String,
    // pub platforms: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Notes {
    pub force_update: bool,
    pub description: String,
    pub content: String,
}

#[tauri::command]
pub async fn fetch_history_releases<R: tauri::Runtime>(
    _app: tauri::AppHandle<R>,
    state: tauri::State<'_, AppState>,
    version: String,
) -> Result<Notes, String> {
    // 目标 URL
    let url = format!(
        "http://192.168.1.19/releases/xarm/assistant/history/{}.json",
        version
    );

    // 在锁的作用域内获取客户端
    let client = state.client.lock().unwrap().clone();
    // 发起 GET 请求
    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;

    // 检查响应状态
    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }

    // 解析 JSON 数据到 Release 结构体
    let release: Release = response.json().await.map_err(|e| e.to_string())?;

    // 将 notes 字段（JSON 字符串）解析为 Notes 结构体
    let notes: Notes = serde_json::from_str(&release.notes).map_err(|e| e.to_string())?;

    // 直接返回 Notes 结构体
    Ok(notes)
}
