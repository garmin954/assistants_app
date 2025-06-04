use chrono::Utc;
use clap::{Parser, ValueEnum};
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::fs::{self, File};
use std::io::BufReader;
use std::path::Path;
use std::sync::Mutex;

mod utils;

#[derive(Debug, Deserialize, Clone)]
struct TauriConfig {
    #[serde(rename = "productName")]
    product_name: String,
    version: String,
}

#[derive(Debug, Clone, ValueEnum, PartialEq)]
enum ReleaseType {
    Beta,
    Stable,
}

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    #[arg(value_enum, default_value_t = ReleaseType::Stable)]
    release_type: ReleaseType,
}

lazy_static! {
    // 定义一个全局的可变变量（使用 Mutex 实现线程安全）
    static ref TAURI_CONFIG: Mutex<TauriConfig> = Mutex::new(TauriConfig {
        product_name: "".to_string(),
        version: "".to_string(),
    });
    // 签名
    static ref SIGNATURE: Mutex<String> = Mutex::new("".to_string());
    // 应用名称
    static ref APP_NAME: Mutex<String> = Mutex::new("".to_string());
    // 发布类型
    static ref RELEASE_TYPE: Mutex<ReleaseType> = Mutex::new(ReleaseType::Stable);
}

fn main() {
    // 解析命令行参数
    let args = Args::parse();
    *RELEASE_TYPE.lock().unwrap() = args.release_type.clone();

    let release_type_str = if args.release_type == ReleaseType::Beta {
        "测试版(Beta)"
    } else {
        "正式版(Stable)"
    };

    println!(
        "【info】:开始生成{}升级包 ----------------------------------------------",
        release_type_str
    );

    // 将config设置成全局的
    match read_tauri_config() {
        Ok(_) => {}
        Err(err) => {
            eprintln!("Error reading tauri.conf.json: {}", err);
            std::process::exit(1);
        }
    };

    // 迁移升级包
    match migrate_upgrade_package() {
        Ok(_) => {
            println!("【success】:迁移升级包成功 ----------------------------------------------");
        }
        Err(err) => {
            eprintln!("Error migrate_upgrade_package: {}", err);
            std::process::exit(1);
        }
    }

    // 生成release.json文件
    match generate_release_json() {
        Ok(_) => {
            println!("【success】:生成release.json文件成功 ----------------------------------------------");
        }
        Err(err) => {
            eprintln!("Error generate_release_json: {}", err);
            std::process::exit(1);
        }
    }

    println!("Success");
}

// 获取配置
fn read_tauri_config() -> Result<TauriConfig, Box<dyn Error>> {
    let mut tc: std::sync::MutexGuard<'_, TauriConfig> = TAURI_CONFIG.lock().unwrap();
    let file = File::open("../src-tauri/tauri.conf.json")?;
    let reader = BufReader::new(file);
    let config: TauriConfig = serde_json::from_reader(reader)?;
    *tc = config.clone();
    Ok(config)
}

// 迁移升级包
fn migrate_upgrade_package() -> Result<(), String> {
    let release_type = RELEASE_TYPE.lock().unwrap();

    // 根据发布类型选择目标目录
    let target_dir = if *release_type == ReleaseType::Beta {
        Path::new(r"\\192.168.1.19\releases\xarm\assistant\beta-packages\window")
    } else {
        Path::new(r"\\192.168.1.19\releases\xarm\assistant\packages\window")
    };

    let config = TAURI_CONFIG.lock().unwrap();
    let arch = utils::get_arch_display_name();

    let path = "../src-tauri/target/release/bundle/msi";
    // UFACTORY 生产工具_2.0.0_x64_zh-CN.msi.sig
    let app_file = format!(
        "{}/{}_{}_{}_zh-CN.msi",
        path, config.product_name, config.version, arch
    );
    let app_file_path = Path::new(&app_file);

    utils::copy_files_to_shared_dir(app_file_path, target_dir).unwrap();

    let mut app_name = APP_NAME.lock().unwrap();
    let s = app_file_path.file_name().unwrap().to_os_string();
    *app_name = s.into_string().unwrap();

    let app_sig_file = format!("{}.sig", app_file);
    let app_sig_path = Path::new(&app_sig_file);

    utils::copy_files_to_shared_dir(app_sig_path, target_dir).unwrap();

    // 存放签名
    let mut signature = SIGNATURE.lock().unwrap();
    // 读取msi.sig签名文件
    *signature = fs::read_to_string(app_sig_path).unwrap();

    Ok(())
}

// 生成release.json文件

#[derive(Serialize, Debug)]
struct Config {
    version: String,
    notes: String,
    pub_date: String,
    platforms: Platforms,
}

#[derive(Serialize, Debug)]
struct Platforms {
    #[serde(rename = "linux-x86_64")]
    linux_x86_64: Platform,
    #[serde(rename = "windows-x86_64")]
    windows_x86_64: Platform,
    #[serde(rename = "darwin-x86_64")]
    darwin_x86_64: Platform,
}

#[derive(Serialize, Debug)]
struct Platform {
    signature: String,
    url: String,
}

#[derive(Serialize, Debug)]
struct Notes {
    force_update: bool,
    description: String,
    content: String,
}

fn generate_release_json() -> Result<(), Box<dyn Error>> {
    let config = TAURI_CONFIG.lock().unwrap();
    let signature = SIGNATURE.lock().unwrap();
    let app_name = APP_NAME.lock().unwrap();
    let release_type = RELEASE_TYPE.lock().unwrap();

    // 将md文件内容转成html
    let content_html = utils::md_to_html().unwrap();

    let notes = Notes {
        force_update: false,
        description: if *release_type == ReleaseType::Beta {
            "这是测试版本，请谨慎更新！".to_string()
        } else {
            "这版修复重要漏洞，请立即更新！".to_string()
        },
        content: content_html.to_string(),
    };

    let notes_str = serde_json::to_string(&notes)?;

    // 获取当前 UTC 时间
    let now = Utc::now();
    // 将时间格式化为 ISO 8601 字符串
    let iso_string = now.to_rfc3339();
    // 如果需要严格匹配 "Z" 后缀，可以替换 "+00:00" 为 "Z"
    let iso_string_z = iso_string.replace("+00:00", "Z");

    // 根据发布类型选择URL路径
    let base_url = if *release_type == ReleaseType::Beta {
        "beta-packages"
    } else {
        "packages"
    };

    let config_json = Config {
        version: format!("v{}", config.version),
        notes: notes_str.to_string(),
        pub_date: iso_string_z.to_string(),
        platforms: Platforms {
            linux_x86_64: Platform {
                signature: signature.to_string(),
                url: format!(
                    "https://192.168.1.19/releases/xarm/assistant/{}/linux/",
                    base_url
                ),
            },
            windows_x86_64: Platform {
                signature: signature.to_string(),
                url: format!(
                    "http://192.168.1.19/releases/xarm/assistant/{}/window/{}",
                    base_url,
                    app_name.to_string()
                ),
            },
            darwin_x86_64: Platform {
                signature: signature.to_string(),
                url: format!(
                    "https://192.168.1.19/releases/xarm/assistant/{}/macos/",
                    base_url
                ),
            },
        },
    };

    // 判断version文件夹是否存在
    if !Path::new("./version").exists() {
        fs::create_dir("./version")?;
    }

    // 根据发布类型选择输出文件名
    let output_filename = if *release_type == ReleaseType::Beta {
        "releases_beta.json"
    } else {
        "releases.json"
    };

    // 生成release.json文件
    let json = serde_json::to_string_pretty(&config_json)?;
    // 先创建一个字符串变量来存储路径
    let releases_path_str = format!("./version/{}", output_filename);
    let releases_path = Path::new(&releases_path_str);
    fs::write(releases_path, json.clone())?;

    println!("Generated {} file: {}", output_filename, config.version);

    // 复制文件到共享目录
    let target_dir = Path::new(r"\\192.168.1.19\releases\xarm\assistant\");
    utils::copy_files_to_shared_dir(releases_path, target_dir).unwrap();

    // 只有正式版才生成历史版本文件
    if *release_type == ReleaseType::Stable {
        let version_file = format!("{}.json", config.version).to_string();
        let version_path_str = format!("./version/{}", version_file);
        let version_path = Path::new(&version_path_str);

        fs::write(version_path, json)?;

        let version_dir = target_dir.join(r"history\".to_string());
        println!("version_dir: {:?}", version_dir);
        utils::copy_files_to_shared_dir(version_path, version_dir.as_path()).unwrap();
    }

    Ok(())
}
