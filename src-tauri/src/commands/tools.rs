use crate::utils::response::Response;
use log::{error, info};
use serde::Serialize;
use serde_json::json;
use tauri::Manager;
use tauri::{ResourceId, Webview};
use tauri_plugin_updater::UpdaterExt;

#[derive(Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Metadata {
    rid: Option<ResourceId>,
    available: bool,
    current_version: String,
    version: String,
    date: Option<String>,
    body: Option<String>,
}

// impl Value for Metadata {

// }

#[tauri::command]
pub async fn set_beta_updater<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    webview: Webview<R>,
) -> Response<serde_json::Value> {
    info!("开始检查测试版更新");

    let update_urls = vec!["http://192.168.1.19/releases/xarm/assistant/releases_beta.json"];

    set_updater_urls(app, webview, update_urls).await
}

#[tauri::command]
pub async fn set_stable_updater<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    webview: Webview<R>,
) -> Response<serde_json::Value> {
    info!("开始检查生产版更新");

    let update_urls = vec![
        "http://192.168.1.19/releases/xarm/assistant/latest.json",
        "https://github.com/garmin954/assistants_app/releases/latest/download/latest.json",
    ];

    set_updater_urls(app, webview, update_urls).await
}

#[tauri::command]
pub async fn is_appimage() -> bool {
    if cfg!(target_os = "linux") {
        return std::env::var("APPIMAGE")
            .map(|value| !value.trim().is_empty())
            .unwrap_or(false);
    }

    true
}

async fn set_updater_urls<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    webview: Webview<R>,
    update_urls: Vec<&str>,
) -> Response<serde_json::Value> {
    let mut endpoints = Vec::with_capacity(update_urls.len());
    for url in update_urls {
        match tauri::Url::parse(url) {
            Ok(parsed) => endpoints.push(parsed),
            Err(e) => return Response::error(format!("解析更新URL失败: {}", e)),
        }
    }

    if let Ok(ub) = app.updater_builder().endpoints(endpoints) {
        info!("更新器初始化成功");
        // 构建更新检查器
        let updater = match ub.build() {
            Ok(u) => u,
            Err(e) => return Response::error(format!("无法初始化更新器: {}", e)),
        };

        // 检查更新
        match updater.check().await {
            Ok(update) => {
                let mut metadata = Metadata::default();
                if let Some(update_data) = update {
                    info!("发现新版本: {}", update_data.version);
                    metadata.available = true;
                    metadata
                        .current_version
                        .clone_from(&update_data.current_version);
                    metadata.version.clone_from(&update_data.version);
                    metadata.date = update_data.date.map(|d| d.to_string());
                    metadata.body.clone_from(&update_data.body);
                    metadata.rid = Some(webview.resources_table().add(update_data));

                    // let update_info = serde_json::json!({
                    //     "version": update_data.version,
                    //     "current_version": update_data.current_version,
                    //     "body": update_data.body,
                    //     "date": update_data.date,
                    //     "rid": rid,
                    // });
                    Response::success(serde_json::to_value(metadata).unwrap_or_else(|e| {
                        error!("序列化 Metadata 失败: {}", e);
                        json!({})
                    }))
                    // Response::success(metadata)
                } else {
                    info!("当前已是最新版本");
                    Response::success(serde_json::json!({
                        "is_latest": true
                    }))
                }
            }
            Err(e) => {
                error!("检查更新失败: {}", e);
                Response::error(format!("检查更新失败: {}", e))
            }
        }
    } else {
        Response::error("无法初始化更新器".to_string())
    }
}
