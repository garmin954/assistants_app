use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};

use crate::{commands::system::SERVER_NAME, utils::process_manage::kill_process};

pub fn setup_desktop_window(app: &AppHandle) -> tauri::Result<()> {
    // 主窗口配置
    let main_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::App("/app".into()))
        .title("")
        .resizable(true)
        .center()
        .shadow(true)
        .min_inner_size(1280.0, 800.0)
        .inner_size(1280.0, 800.0)
        .visible(true);

    // Windows 和 Linux 平台特定配置
    #[cfg(any(target_os = "windows", target_os = "linux"))]
    {
        // main_builder = main_builder.transparent(true);
    }

    // macOS 平台特定配置
    #[cfg(target_os = "macos")]
    {
        use tauri::utils::TitleBarStyle;
        main_builder = main_builder.title_bar_style(TitleBarStyle::Transparent);
    }

    // 构建主窗口和消息窗口
    let main_window = main_builder.build()?;

    // 监听窗口事件
    #[cfg(any(target_os = "windows", target_os = "linux", target_os = "macos"))]
    main_window
        .clone()
        .on_window_event(move |event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                println!("关闭请求，窗口将最小化而不是关闭。");
                println!("ap,{:?}i", api);

                let _ = kill_process(SERVER_NAME);
                std::process::exit(0);
            }
            _ => {}
        });

    // 仅在构建 macOS 时设置背景颜色
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::{NSColor, NSWindow};
        use cocoa::base::{id, nil};

        let ns_window = main_window.clone().ns_window().unwrap() as id;
        unsafe {
            let bg_color = NSColor::colorWithRed_green_blue_alpha_(
                nil,
                50.0 / 255.0,
                158.0 / 255.0,
                163.5 / 255.0,
                1.0,
            );
            ns_window.setBackgroundColor_(bg_color);
        }
    }
    Ok(())
}

#[cfg(desktop)]
pub fn show_window(app: &AppHandle) {
    if let Some(window) = app.webview_windows().get("main") {
        window
            .unminimize()
            .unwrap_or_else(|e| eprintln!("取消最小化窗口时出错: {:?}", e));
        window
            .show()
            .unwrap_or_else(|e| eprintln!("显示窗口时出错: {:?}", e));
        window
            .set_focus()
            .unwrap_or_else(|e| eprintln!("聚焦窗口时出错: {:?}", e));
    } else {
        eprintln!("未找到窗口");
        // 创建窗口
        setup_desktop_window(app).unwrap_or_else(|e| eprintln!("创建窗口时出错: {:?}", e));
    }
}
