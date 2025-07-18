// csv_exporter.rs
use crate::commands::arm_service::robot_data::RobotDataPacket;
use csv::Writer;
use std::io::{self};

#[allow(dead_code)]
pub struct CsvExporter {
    writer: Writer<std::fs::File>,
}

impl CsvExporter {
    pub fn new(path: &str) -> io::Result<Self> {
        let mut writer = Writer::from_path(path)?;
        Ok(Self { writer })
    }

    pub fn write_packet(&mut self, packet: &RobotDataPacket) -> io::Result<()> {
        // 写入时间戳
        let mut record = vec![packet.timestamp.to_string()];

        // 写入关节电流
        for current in &packet.actual_joint_currents {
            record.push(current.to_string());
        }

        // 写入 TCP 位置和姿态
        for value in &packet.actual_tcp_pose {
            record.push(value.to_string());
        }

        // 写入 CSV
        self.writer.write_record(&record)?;
        self.writer.flush()?;

        Ok(())
    }
}
