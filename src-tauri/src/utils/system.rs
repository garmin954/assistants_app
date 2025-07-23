use std::error::Error;
use std::path::PathBuf;
use tauri::Manager;

#[allow(dead_code)]
pub fn app_path_join<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
) -> Result<PathBuf, Box<dyn Error>> {
    let app_config_dir = app
        .app_handle()
        .path()
        .resource_dir()
        .expect("Failed to get resource directory");

    Ok(app_config_dir)
}
