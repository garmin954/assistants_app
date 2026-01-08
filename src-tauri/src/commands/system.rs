#[tauri::command]
pub async fn app_exit<R: tauri::Runtime>(app: tauri::AppHandle<R>) {
    app.exit(0);
}
