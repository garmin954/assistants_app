use chrono::Local;
use state::threads::get_state_data;
use tauri::Manager;
// use utils::process_manage;
// use tauri_plugin_global_shortcut::{Code, Modifiers, ShortcutState};
use crate::utils::system::open_server;
use std::env;
use tauri_plugin_log::{Target, TargetKind};

mod commands;
mod state;
mod utils;
// 桌面端依赖
#[cfg(desktop)]
mod desktops;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = state::app_state::AppState::new();
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = desktops::window::show_window(app);
        }))
        .manage(app_state)
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        // .plugin(process_manage::init())
        .setup(|app| {
            let handle = app.handle();
            // desktops::tray::setup_tray(handle)?;
            desktops::window::setup_desktop_window(handle)?;
            #[cfg(desktop)]
            handle.plugin(tauri_plugin_updater::Builder::new().build())?;
            handle.plugin(commands::init())?;
            get_state_data(handle);

            let app_path = handle.path().resource_dir()?;

            // 获取当前日期并格式化为 年_月_日
            let log_file_name = Local::now().format("%Y_%m_%d").to_string();
            // 日志
            handle.plugin(
                tauri_plugin_log::Builder::new()
                    .targets([
                        Target::new(TargetKind::Stdout),
                        Target::new(TargetKind::LogDir { file_name: None }),
                        Target::new(TargetKind::Webview),
                        Target::new(TargetKind::Folder {
                            path: std::path::PathBuf::from(app_path.join("log").join("rs")),
                            file_name: Some(log_file_name),
                        }),
                    ])
                    .build(),
            )?;

            // 开启服务
            open_server(app_path.clone(), commands::system::SERVER_NAME);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("run fail");
}
