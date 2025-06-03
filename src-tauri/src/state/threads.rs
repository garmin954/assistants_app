use std::{thread, time::Duration};
use tauri::{path::BaseDirectory, AppHandle, Emitter, Manager};

use crate::{
    commands::system::SERVER_NAME, state::app_state::AppState,
    utils::process_manage::is_process_running,
};

// #[derive(Serialize, Clone, Debug)]
// struct StateData {
//     server_status: bool,
// }

pub fn get_state_data(rx: &AppHandle) {
    let app_handle = rx.clone();

    let config_path = rx
        .path()
        .resolve("releases/uf_product_config.ini", BaseDirectory::Resource)
        .unwrap();

    thread::spawn(move || loop {
        let exist_config = config_path.exists();
        let state = app_handle.state::<AppState>();
        let mut state_data = state.state_data.lock().unwrap();
        // update_state_data(&mut app_state);
        state_data.server_status = is_process_running(SERVER_NAME);
        app_handle
            .emit(
                "process-status-update",
                (state_data.server_status, exist_config),
            )
            .unwrap();

        thread::sleep(Duration::from_secs(3));
    });
}
