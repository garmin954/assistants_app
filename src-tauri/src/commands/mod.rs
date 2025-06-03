use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};
pub mod request;
pub mod system;
pub mod tools;

#[tauri::command]
pub fn greet(name: String) -> String {
    println!("Registered command: some_command");
    // Ok(("success"))
    format!("Hello, {}! You've been greeted from Rust!", name)
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("commands")
        .invoke_handler(tauri::generate_handler![
            system::app_exit,
            system::system_info,
            system::quit_server,
            system::start_server,
            system::get_server_state,
            system::find_latest_firmware,
            system::open_studio_window,
            system::start_udp_broadcast,
            system::stop_udp_broadcast,
            system::updater_service,
            request::fetch_history_releases,
            request::update_config_ini,
            request::download_resources,
            tools::set_beta_updater,
            tools::set_stable_updater,
            greet,
        ])
        .build()
}
