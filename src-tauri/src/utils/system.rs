use log;
use std::error::Error;
use std::fs::metadata;
use std::io::BufRead;
use std::io::BufReader;
use std::os::windows::process::CommandExt;
use std::path::Path;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use tauri::Manager;

// use crate::utils::process_manage::{is_process_running, kill_process};

// pub fn relative_command_path(command: &Path) -> Result<PathBuf, Box<dyn Error>> {
//     match platform::current_exe()?.parent() {
//         #[cfg(windows)]
//         Some(exe_dir) => Ok(exe_dir.join(command).with_extension("exe")),
//         #[cfg(not(windows))]
//         Some(exe_dir) => Ok(exe_dir.join(command)),
//         None => Err("Failed to find executable path".into()),
//     }
// }

pub fn open_server(app_path: PathBuf, server_name: &str) -> Option<std::process::Child> {
    #[cfg(windows)]
    let server_path = app_path.join(format!("{}.exe", server_name));

    #[cfg(not(windows))]
    let server_path = app_path.join(server_name);

    if !server_path.exists() {
        log::error!("{} 程序文件不存在", server_name);
        return None;
    }

    // // 判断程序是否在运行
    // if is_process_running(server_name) {
    //     // 先杀掉进程
    //     log::info!("{} 已经在运行，正在尝试杀掉该进程...", server_name);
    //     match kill_process(server_name) {
    //         Ok(_) => {
    //             // 添加确认等待循环
    //             let mut attempts = 0;
    //             while attempts < 5 && is_process_running(&server_name) {
    //                 std::thread::sleep(std::time::Duration::from_millis(200));
    //                 attempts += 1;
    //             }

    //             if is_process_running(&server_name) {
    //                 log::error!("进程终止确认失败，放弃启动");
    //                 return None;
    //             }
    //             log::info!("{} 进程已成功终止，准备重新启动", &server_name);
    //         }
    //         Err(e) => {
    //             log::error!("无法杀掉 {} 进程: {}", server_name, e);
    //             return None;
    //         }
    //     }
    // }

    log::info!("正在启动 {} 进程...", server_name);
    let smf = app_path.to_string_lossy().to_string();

    let root_src = remove_extended_path_prefix(&smf);
    log::info!("app_path 应用安装路径：{}", root_src);

    let mut child = Command::new(server_path)
        // .arg("-r") // 传递根目录
        // .arg(root_src)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .creation_flags(0x8000000)
        .spawn()
        .expect("Failed to start process");

    // 获取标准输出和错误输出的句柄
    let stdout = child.stdout.take().expect("无法获取标准输出");
    let stderr = child.stderr.take().expect("无法获取标准错误");

    let stdout_name = server_name.to_string();
    let stderr_name = server_name.to_string();

    // 创建线程处理标准输出
    std::thread::spawn(move || {
        let mut reader = BufReader::new(stdout);
        let mut line = String::new();
        while let Ok(n) = reader.read_line(&mut line) {
            if n == 0 {
                break;
            }
            log::info!("[{}]==> {}", stdout_name, line.trim());
            line.clear();
        }
    });

    // 创建线程处理标准错误
    std::thread::spawn(move || {
        let mut reader = BufReader::new(stderr);
        let mut line = String::new();
        while let Ok(n) = reader.read_line(&mut line) {
            if n == 0 {
                break;
            }
            log::error!("[{}]==> {}", stderr_name, line.trim());
            line.clear();
        }
    });

    log::info!("{} 进程启动成功", server_name);

    Some(child)
}

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

pub fn remove_extended_path_prefix(path: &str) -> &str {
    if path.starts_with(r"\\?\") {
        &path[4..]
    } else {
        path
    }
}

#[allow(dead_code)]
pub fn is_executable_file(path: &Path) -> bool {
    if let Ok(metadata) = metadata(path) {
        // 首先检查是否为文件
        if metadata.is_file() {
            #[cfg(unix)]
            {
                // 在Unix系统上，检查文件权限
                let permissions = metadata.permissions();
                let mode = permissions.mode();
                let is_executable = (mode & 0o111) != 0;
                return is_executable;
            }
            #[cfg(windows)]
            {
                // 在Windows系统上，通常文件被认为是可执行的，如果它有.exe等可执行扩展名
                let extension = path.extension().and_then(|s| s.to_str());
                return extension == Some("exe")
                    || extension == Some("bat")
                    || extension == Some("cmd");
            }
        }
    }
    false
}
