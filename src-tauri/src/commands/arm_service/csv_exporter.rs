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
}

impl CsvExporter {
    pub fn new() -> io::Result<Self> {
        let timestamp = Local::now().format("%Y%m%d_%H%M%S");
        let temp_dir = std::env::temp_dir();
        let temp_path = temp_dir.join(format!("robot_data_{}.csv", timestamp));
        let writer = Writer::from_path(temp_path.clone())?;
        Ok(Self { writer, temp_path })
    }

    /// 写入数据
    pub fn write_packet(&mut self, packet: &ResponseChartData) -> io::Result<()> {
        let mut record: Vec<String> = vec![];

        // 写入时间戳 当前时间
        record.push(Local::now().timestamp_micros().to_string());

        // 写入数据
        for cd in &packet.data {
            for val in &cd.value {
                record.push(val.to_string());
            }
        }

        // 写入 CSV
        self.writer.write_record(&record)?;
        self.writer.flush()?;

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
