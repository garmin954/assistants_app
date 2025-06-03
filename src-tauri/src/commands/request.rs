use crate::state::app_state::AppState;
use crate::utils::system::app_path_join;
use log::info;
use serde::Deserialize;
use serde::Serialize;

use futures::StreamExt;
use reqwest::Client;
use std::io::Write;
use std::time::Instant;
use std::{fs::File, io};
use tauri::Emitter;
use zip::ZipArchive;

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
        "http://192.168.1.19/releases/xarm/xarm_tool/history/{}.json",
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

#[tauri::command]
pub async fn download_resources<R: tauri::Runtime>(
    window: tauri::Window<R>,
    app: tauri::AppHandle<R>,
) -> Result<String, String> {
    let url = "http://192.168.1.19/releases/QA_Data/resources.zip";
    let client = Client::new();
    let response = client.get(url).send().await.map_err(|e| e.to_string())?;
    let app_path = app_path_join(app).expect("Failed to get resource directory");

    let save_path = app_path.join("./resources.zip");

    info!("开始下载文件: {}--{:?}", url, save_path);
    let total_size = response
        .content_length()
        .ok_or("无法获取文件大小".to_string())?;

    let mut file = File::create(&save_path).map_err(|e| e.to_string())?;
    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();
    let start_time = Instant::now();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;

        // 计算进度和速度
        let elapsed_time = start_time.elapsed().as_secs_f64();
        let progress = (downloaded as f64 / total_size as f64) * 100.0;
        let speed = downloaded as f64 / elapsed_time / 1024.0; // KB/s

        // 将进度和速度发送到前端
        window
            .emit(
                "download_progress",
                serde_json::json!({
                    "progress": progress,
                    "speed": speed,
                    "step": "download",
                    "downloaded": downloaded,
                    "total_size": total_size,
                }),
            )
            .map_err(|e| e.to_string())?;
    }

    let extract_path = app_path.join("./");

    // 将进度和速度发送到前端
    window
        .emit(
            "download_progress",
            serde_json::json!({
                "step": "extract",
            }),
        )
        .map_err(|e| e.to_string())?;

    // 下载完成后，解压文件
    if let Err(e) = extract_zip(save_path.to_str().unwrap(), extract_path.to_str().unwrap()) {
        return Err(e.to_string());
    }

    Ok("下载完成".to_string())
}

// 解压 ZIP 文件的函数
fn extract_zip(zip_path: &str, extract_path: &str) -> Result<(), String> {
    let file = File::open(zip_path).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;
    info!("文件解压:文件路径{}--解压路径{}", zip_path, extract_path);

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let outpath = match file.enclosed_name() {
            Some(path) => std::path::Path::new(extract_path).join(path),
            None => continue,
        };

        if file.name().ends_with('/') {
            // 创建目录
            std::fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
        } else {
            // 创建文件并写入内容
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    std::fs::create_dir_all(p).map_err(|e| e.to_string())?;
                }
            }
            let mut outfile = File::create(&outpath).map_err(|e| e.to_string())?;
            io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
        }
    }

    // 删除压缩包文件
    std::fs::remove_file(zip_path).map_err(|e| e.to_string())?;

    Ok(())
}

// 更新下载uf_product_config文件
#[tauri::command]
pub async fn update_config_ini<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let url = "http://192.168.1.19/releases/QA_Data/uf_product_config.ini";
    let client = state.client.lock().unwrap().clone();
    let response = client.get(url).send().await.map_err(|e| e.to_string())?;

    // 检查响应状态
    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }

    let app_path = app_path_join(app).expect("Failed to get resource directory");
    let save_path = app_path.join("releases/uf_product_config.ini");

    let mut file = File::create(&save_path).map_err(|e| e.to_string())?;
    let bytes = response.bytes().await.map_err(|e| e.to_string())?;
    file.write_all(&bytes).map_err(|e| e.to_string())?;
    Ok(())
}
