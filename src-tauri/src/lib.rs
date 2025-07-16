use chrono::{Local, Utc};
use state::threads::get_state_data;
use std::{env, sync::Arc};
use tauri::Manager;
use tauri_plugin_log::{Target, TargetKind};

use crate::state::app_state::GLOBAL_APP_HANDLE;

mod commands;
mod desktops;
mod state;
mod utils;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet() -> String {
    format!("Hello, ! You've been greeted from Rust!")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let utc_time = Utc::now();
    // 直接使用 Asia::Shanghai 作为时区结构体
    let china_time = utc_time.with_timezone(&Local); // 使用时区转换，不需要显式指定类型
    let log_file_name = china_time.format("%Y_%m_%d").to_string();

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = desktops::window::show_window(app);
        }))
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                    Target::new(TargetKind::Folder {
                        path: std::path::PathBuf::from("log/rs"), // 或你动态计算的路径
                        file_name: Some(log_file_name),           // 如果必须动态，仍得放进 `.setup`
                    }),
                ])
                .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
                .build(),
        )
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            commands::system::app_exit,
            commands::system::system_info,
            commands::system::quit_server,
            commands::system::start_server,
            commands::system::get_server_state,
            commands::system::find_latest_firmware,
            commands::system::open_studio_window,
            commands::system::start_udp_broadcast,
            commands::system::stop_udp_broadcast,
            commands::system::updater_service,
            commands::request::fetch_history_releases,
            commands::request::update_config_ini,
            commands::request::download_resources,
            commands::tools::set_beta_updater,
            commands::tools::set_stable_updater,
            commands::arm_service::connect_robot_server,
            commands::arm_service::disconnect_robot_server,
            commands::arm_service::start_assistant,
            commands::arm_service::stop_assistant,
            commands::arm_service::get_robot_axis,
            commands::get_shared_state,
            greet
        ])
        .setup(|app| {
            let handle = app.handle();
            let app_arc = Arc::new(app.app_handle().clone());
            GLOBAL_APP_HANDLE
                .set(app_arc)
                .expect("Failed to set global app handle");

            let app_state = state::app_state::AppState::new(handle.clone());
            // let app_state_arc = Arc::new(app_state);
            app.manage(app_state);
            desktops::window::setup_desktop_window(handle)?;
            get_state_data(handle);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
