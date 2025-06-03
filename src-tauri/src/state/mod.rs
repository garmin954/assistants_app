pub mod app_state; // 导入 app_state 模块
pub mod threads; // 导入 app_state 模块

// pub fn init<R: Runtime>() -> TauriPlugin<R> {
//     Builder::<R>::new("state")
//         .invoke_handler(tauri::generate_handler![app_state::update_user_settings,])
//         .build()
// }
