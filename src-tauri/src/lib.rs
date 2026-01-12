use chrono::Local;
use std::sync::Arc;
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
    "Hello, ! You've been greeted from Rust!".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            desktops::window::show_window(app);
        }))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::system::app_exit,
            commands::request::fetch_history_releases,
            commands::tools::set_beta_updater,
            commands::tools::set_stable_updater,
            commands::tools::is_appimage,
            commands::arm_service::connect_robot_server,
            commands::arm_service::disconnect_robot_server,
            commands::arm_service::start_assistant,
            commands::arm_service::stop_assistant,
            commands::arm_service::get_robot_axis,
            commands::arm_service::save_csv,
            commands::get_shared_state,
            commands::debug::get_user_data_paths,
            greet
        ])
        .setup(|app| {
            let handle = app.handle();
            let app_arc = Arc::new(app.app_handle().clone());
            GLOBAL_APP_HANDLE
                .set(app_arc)
                .expect("Failed to set global app handle");

            // 初始化 AppState (包含用户数据路径)
            let app_state = state::app_state::AppState::new(handle.clone())
                .expect("Failed to initialize app state");

            // 配置日志插件,使用自定义路径
            let log_file_name = Local::now().format("%Y_%m_%d").to_string();
            let log_plugin = tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::Webview),
                    Target::new(TargetKind::Folder {
                        path: app_state.user_data_paths.logs.clone(),
                        file_name: Some(log_file_name),
                    }),
                ])
                .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
                .build();

            // 注册日志插件
            handle.plugin(log_plugin)?;

            app.manage(app_state);
            desktops::window::setup_desktop_window(handle)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
