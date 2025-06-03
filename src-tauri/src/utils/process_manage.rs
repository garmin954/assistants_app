use std::io;
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use std::process::Command;

// use std::path::Path;
// use std::process::{Child, Command};
// use tauri::plugin::{Builder as PluginBuilder, TauriPlugin};
// use tauri::Manager;

// pub fn kill_process(server_name: &str) -> Result<String, String> {
//     // 在不同的操作系统上使用不同的命令
//     let command = if cfg!(target_os = "windows") {
//         // Windows: 使用 taskkill 结束进程
//         Command::new("taskkill")
//             .arg("/IM")
//             .arg(format!("{}.exe", server_name))
//             .arg("/F")
//             .creation_flags(0x8000000)
//             .output()
//             .map_err(|e| e.to_string())
//     } else if cfg!(target_os = "macos") {
//         // macOS: 使用 pkill 结束进程
//         Command::new("pkill")
//             .arg(server_name)
//             .output()
//             .map_err(|e| e.to_string())
//     } else if cfg!(target_os = "linux") {
//         // Linux: 使用 killall 结束进程
//         Command::new("killall")
//             .arg(server_name)
//             .output()
//             .map_err(|e| e.to_string())
//     } else {
//         Err("Unsupported OS".to_string())
//     };

//     match command {
//         Ok(output) => {
//             if output.status.success() {
//                 Ok("Process killed successfully".to_string())
//             } else {
//                 Err(format!(
//                     "Failed to kill process: {}",
//                     String::from_utf8_lossy(&output.stderr)
//                 ))
//             }
//         }
//         Err(e) => Err(format!("Error executing command: {}", e)),
//     }
// }

// pub fn is_process_running(process_name: &str) -> bool {
//     let mut sys = System::new_all();
//     sys.refresh_all();

//     #[cfg(windows)]
//     let process_name = format!("{}.exe", process_name);
//     for (_, process) in sys.processes() {
//         if process.name().to_string_lossy() == process_name {
//             return true;
//         }
//     }

//     false
// }

// use crate::commands::system::SERVER_NAME;

// pub struct ProcessPlugin {
//     child_process: Option<Child>,
// }

// impl ProcessPlugin {
//     fn new() -> Self {
//         Self {
//             child_process: None,
//         }
//     }

//     fn start_binary(&mut self) -> Result<(), String> {
//         let command = Path::new(SERVER_NAME);

//         let child = Command::new(command).spawn().map_err(|e| e.to_string())?;
//         self.child_process.replace(child);
//         Ok(())
//     }

//     fn kill_binary(&mut self) -> Result<(), String> {
//         if let Some(mut child) = self.child_process.take() {
//             child.kill().map_err(|e| e.to_string())?;
//         }
//         Ok(())
//     }
// }

// pub fn init() -> TauriPlugin<tauri::Wry> {
//     PluginBuilder::new("process")
//         .setup(|app_handle, _api| {
//             let plugin = ProcessPlugin::new();
//             app_handle.manage(plugin);
//             Ok(())
//         })
//         .build()
// }

// 销毁进程

// fn main() {
//     tauri::Builder::default()
//         .plugin(init())
//         .run(tauri::generate_context!())
//         .expect("error while running tauri application");
// }

// 检查进程是否正在运行
#[cfg(target_os = "windows")]
pub fn is_process_running(process_name: &str) -> bool {
    use std::process::Output;
    let output: Output = Command::new("tasklist")
        .creation_flags(0x8000000)
        .output()
        .expect("Failed to execute tasklist");
    let output_str = String::from_utf8_lossy(&output.stdout);
    output_str.contains(&process_name)
}
#[cfg(any(target_os = "linux", target_os = "macos"))]
pub fn is_process_running(process_name: &str) -> bool {
    use std::process::Output;
    let output: Output = Command::new("ps")
        .arg("-A")
        .output()
        .expect("Failed to execute ps");
    let output_str = String::from_utf8_lossy(&output.stdout);
    output_str.contains(process_name)
}
// 杀掉正在运行的进程
#[cfg(target_os = "windows")]
pub fn kill_process(process_name: &str) -> io::Result<()> {
    let process_name = format!("{}.exe", process_name);
    Command::new("taskkill")
        .arg("/F")
        .arg("/IM")
        .arg(process_name)
        .creation_flags(0x8000000)
        .status()?;
    Ok(())
}
#[cfg(any(target_os = "linux", target_os = "macos"))]
pub fn kill_process(process_name: &str) -> io::Result<()> {
    use std::process::Output;
    let output: Output = Command::new("pgrep").arg(process_name).output()?;
    let pids = String::from_utf8_lossy(&output.stdout);
    for pid_str in pids.split_whitespace() {
        if let Ok(pid) = pid_str.parse::<u32>() {
            Command::new("kill")
                .arg("-9")
                .arg(pid.to_string())
                .status()?;
        }
    }
    Ok(())
}
