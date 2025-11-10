// csv_exporter.rs
use crate::commands::arm_service::structs::ResponseChartData;
use chrono::Local;
use csv::Writer;
use std::{
    io::{self},
    path::PathBuf,
};

#[derive(Debug)]
#[allow(dead_code)]
pub struct CsvExporter {
    writer: Writer<std::fs::File>,
    temp_path: PathBuf,
    csv_temp_dir: PathBuf, // 用户数据目录中的CSV临时目录
}

impl CsvExporter {
    /// 创建新的CSV导出器
    ///
    /// # 参数
    /// * `csv_temp_dir` - CSV临时文件目录 (来自 UserDataPaths.csv_temp)
    pub fn new(csv_temp_dir: PathBuf) -> io::Result<Self> {
        // 确保目录存在
        std::fs::create_dir_all(&csv_temp_dir)?;

        let timestamp = Local::now().format("%Y%m%d_%H%M%S");
        let temp_path = csv_temp_dir.join(format!("robot_data_{timestamp}.csv"));
        let writer = Writer::from_path(&temp_path)?;

        Ok(Self {
            writer,
            temp_path,
            csv_temp_dir,
        })
    }

    /// 创建新的临时文件
    pub fn create(&mut self) -> io::Result<()> {
        // 先尝试删除旧文件
        let _ = self.delete();

        let timestamp = Local::now().format("%Y%m%d_%H%M%S");
        let temp_path = self.csv_temp_dir.join(format!("robot_data_{timestamp}.csv"));
        let writer = Writer::from_path(&temp_path)?;

        self.temp_path = temp_path;
        self.writer = writer;

        Ok(())
    }

    /// 删除临时文件
    #[allow(dead_code)]
    pub fn delete(&mut self) -> io::Result<()> {
        if self.temp_path.exists() {
            std::fs::remove_file(&self.temp_path)?;
        }
        Ok(())
    }

    /// 写入数据
    pub fn write_packet(&mut self, packet: &ResponseChartData) -> io::Result<()> {
        self.writer.flush()?;

        let mut record: Vec<String> = vec![];

        // 写入时间戳 当前时间
        record.push(Local::now().timestamp_millis().to_string());

        // 写入数据
        for cd in &packet.data {
            for val in &cd.value {
                record.push(val.to_string());
            }
        }

        // 写入 CSV
        self.writer.write_record(&record)?;
        self.writer.flush()?;

        // 强制换行
        Ok(())
    }

    /// 保存CSV文件到指定路径
    pub fn save_to(&mut self, dest_path: &PathBuf) -> std::io::Result<()> {
        // 关闭写入器
        self.writer.flush()?;

        // 复制临时文件到目标路径
        std::fs::copy(&self.temp_path, dest_path)?;

        Ok(())
    }

    /// 清空临时文件
    #[allow(dead_code)]
    pub fn clear_temp_file(&mut self) -> std::io::Result<()> {
        // 关闭写入器
        self.writer.flush()?;

        // 清空临时文件
        std::fs::write(&self.temp_path, "")?;

        Ok(())
    }

    /// 获取临时文件路径
    #[allow(dead_code)]
    pub fn temp_path(&self) -> &PathBuf {
        &self.temp_path
    }
}
