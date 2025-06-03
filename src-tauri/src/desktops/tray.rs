// // tray.rs
// use tauri::{
//     menu::{MenuBuilder, MenuItemBuilder},
//     tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
//     AppHandle, Emitter, Manager,
// };

// use crate::{commands::system::SERVER_NAME, utils::process_manage::kill_process};
// // use crate::utils::process_manage::ProcessPlugin;

// #[derive(Clone, serde::Serialize)]
// struct Payload {
//     message: String,
// }

// // 不要该功能！
// pub fn _setup_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
//     let setting = MenuItemBuilder::with_id("setting", "设置").build(app)?;
//     let restart = MenuItemBuilder::with_id("restart", "重启").build(app)?;
//     let quit = MenuItemBuilder::with_id("quit", "退出").build(app)?;

//     let menu = MenuBuilder::new(app)
//         .items(&[&restart, &setting, &quit])
//         .build()?;

//     TrayIconBuilder::with_id("tray_icon")
//         .menu(&menu)
//         .icon(app.default_window_icon().unwrap().clone())
//         .title("UFACTORY 生产工具")
//         .tooltip("UFACTORY 生产工具")
//         .menu_on_left_click(false)
//         .on_menu_event(move |app, event| match event.id().as_ref() {
//             "setting" => {
//                 let window = app.get_webview_window("main").unwrap();
//                 window.unminimize().unwrap();
//                 window.show().unwrap();
//                 window.set_focus().unwrap();
//                 window
//                     .emit(
//                         "router",
//                         Payload {
//                             message: "/settings".into(),
//                         },
//                     )
//                     .unwrap();
//             }
//             // "to_host" => {
//             //     let window = app.get_webview_window("main").unwrap();
//             //     window
//             //         .emit(
//             //             "open_url",
//             //             Payload {
//             //                 message: "https://baidu.com".into(),
//             //             },
//             //         )
//             //         .unwrap();
//             // }
//             "quit" => {
//                 let res = kill_process(SERVER_NAME);
//                 println!("res==>{:#?}", res);
//                 // let process = app.state::<ProcessPlugin>();
//                 // let _ =process.kill_binary().unwrap();

//                 std::process::exit(0);
//             }
//             "restart" => {
//                 app.restart();
//             }
//             _ => (),
//         })
//         .on_tray_icon_event(|tray, event| match event {
//             TrayIconEvent::Click {
//                 id: _,
//                 rect: _,
//                 button,
//                 button_state: MouseButtonState::Up,
//                 ..
//             } => match button {
//                 MouseButton::Left {} => {
//                     let app = tray.app_handle();
//                     if let Some(webview_window) = app.get_webview_window("main") {
//                         let _ = webview_window.unminimize();
//                         let _ = webview_window.show();
//                         let _ = webview_window.set_focus();
//                     } else {
//                         show_window(&app);
//                     }
//                     app.emit("tray_click", ()).unwrap();
//                 }
//                 MouseButton::Right {} => {}
//                 _ => {}
//             },
//             TrayIconEvent::Enter {
//                 id: _,
//                 position,
//                 rect: _,
//             } => {
//                 let app = tray.app_handle();
//                 app.emit("tray_mouseenter", position).unwrap();
//                 let msgbox = app.get_webview_window("msgbox").unwrap();
//                 msgbox.set_focus().unwrap();
//             }
//             TrayIconEvent::Leave {
//                 id: _,
//                 position,
//                 rect: _,
//             } => {
//                 let app = tray.app_handle();
//                 std::thread::sleep(std::time::Duration::from_millis(200));
//                 if let Some(webview_window) = app.get_webview_window("msgbox") {
//                     if !webview_window.is_focused().unwrap() {
//                         webview_window.hide().unwrap();
//                     };
//                 }
//                 app.emit("tray_mouseleave", position).unwrap();
//             }
//             _ => {}
//         })
//         .build(app)?;
//     Ok(())
// }

// #[cfg(desktop)]
// pub fn show_window(app: &AppHandle) {
//     use crate::desktops::window::setup_desktop_window;

//     if let Some(window) = app.webview_windows().get("main") {
//         window
//             .unminimize()
//             .unwrap_or_else(|e| eprintln!("取消最小化窗口时出错: {:?}", e));
//         window
//             .show()
//             .unwrap_or_else(|e| eprintln!("显示窗口时出错: {:?}", e));
//         window
//             .set_focus()
//             .unwrap_or_else(|e| eprintln!("聚焦窗口时出错: {:?}", e));
//     } else {
//         eprintln!("未找到窗口");
//         // 创建窗口
//         setup_desktop_window(app).unwrap_or_else(|e| eprintln!("创建窗口时出错: {:?}", e));
//     }
// }
