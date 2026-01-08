// user_data.rs - 用户数据目录管理
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// 用户数据目录结构
#[derive(Debug)]
pub struct UserDataPaths {
    /// 根目录:
    /// - Windows: C:\Users\<用户名>\AppData\Roaming\com.ufactory.arm-assistants
    /// - Linux: ~/.config/com.ufactory.arm-assistants
    /// - macOS: ~/Library/Application Support/com.ufactory.arm-assistants
    #[allow(dead_code)]
    pub root: PathBuf,

    /// 日志目录: {root}/logs
    pub logs: PathBuf,

    /// CSV数据目录: {root}/csv_data
    pub csv_data: PathBuf,

    /// CSV临时目录: {root}/csv_temp
    pub csv_temp: PathBuf,

    /// 配置目录: {root}/config
    pub config: PathBuf,
}

impl UserDataPaths {
    /// 初始化用户数据目录
    ///
    /// 使用 app_config_dir() 获取配置目录:
    /// - Windows: %APPDATA% (Roaming)
    /// - Linux: ~/.config
    /// - macOS: ~/Library/Application Support
    pub fn new(app: &AppHandle) -> Result<Self, String> {
        let root = app
            .path()
            .app_config_dir()
            .map_err(|_| format!("Failed to get app config directory"))?;

        let logs = root.join("logs");
        let csv_data = root.join("csv_data");
        let csv_temp = root.join("csv_temp");
        let config = root.join("config");

        let paths = Self {
            root,
            logs,
            csv_data,
            csv_temp,
            config,
        };

        // 创建所有必要的目录
        paths.ensure_dirs_exist()?;

        Ok(paths)
    }

    /// 确保所有目录存在
    fn ensure_dirs_exist(&self) -> Result<(), String> {
        for dir in [&self.logs, &self.csv_data, &self.csv_temp, &self.config] {
            std::fs::create_dir_all(dir)
                .map_err(|_| format!("Failed to create directory: {}", dir.display()))?;
        }
        Ok(())
    }

    /// 生成带时间戳的CSV临时文件路径
    #[allow(dead_code)]
    pub fn csv_temp_file(&self, timestamp: &str) -> PathBuf {
        self.csv_temp.join(format!("robot_data_{timestamp}.csv"))
    }

    /// 生成日志文件路径
    #[allow(dead_code)]
    pub fn log_file(&self, date: &str) -> PathBuf {
        self.logs.join(format!("{date}.log"))
    }

    /// 清理旧的临时文件 (保留最近N天)
    #[allow(dead_code)]
    pub fn cleanup_temp_files(&self, keep_days: u32) -> Result<(), String> {
        use std::time::{SystemTime, UNIX_EPOCH};

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|_| format!("Failed to get current time"))?
            .as_secs();

        let cutoff = now - (keep_days as u64 * 24 * 3600);

        if let Ok(entries) = std::fs::read_dir(&self.csv_temp) {
            for entry in entries.flatten() {
                if let Ok(metadata) = entry.metadata() {
                    if let Ok(created) = metadata.created() {
                        if let Ok(created_secs) = created.duration_since(UNIX_EPOCH) {
                            if created_secs.as_secs() < cutoff {
                                let _ = std::fs::remove_file(entry.path());
                            }
                        }
                    }
                }
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_csv_temp_file() {
        // 模拟路径测试
        let paths = UserDataPaths {
            root: PathBuf::from("/test"),
            logs: PathBuf::from("/test/logs"),
            csv_data: PathBuf::from("/test/csv_data"),
            csv_temp: PathBuf::from("/test/csv_temp"),
            config: PathBuf::from("/test/config"),
        };

        let temp_file = paths.csv_temp_file("20250107_120000");
        assert_eq!(
            temp_file,
            PathBuf::from("/test/csv_temp/robot_data_20250107_120000.csv")
        );
    }
}
