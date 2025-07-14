use crate::commands::arm_service::robot_data::RobotDataPacket;
use std::io::Result;

/// 机器人数据解析器
#[derive(Debug)]
pub struct Parser {}

impl Parser {
    pub fn new() -> Self {
        Self {}
    }

    /// 处理缓冲区中的所有完整数据包
    pub fn process_packets<F>(&self, buffer: &mut Vec<u8>, mut handler: F) -> Result<usize>
    where
        F: FnMut(&RobotDataPacket) -> Result<()>,
    {
        let mut processed = 0;

        while let Some(packet_size) = self.get_packet_size(buffer) {
            if buffer.len() >= packet_size {
                let packet_data = &buffer[0..packet_size];

                match self.parse_packet(packet_data) {
                    Ok(packet) => {
                        handler(&packet)?;
                        processed += 1;
                    }
                    Err(e) => eprintln!("解析错误: {}", e),
                }

                // 移除已处理数据
                buffer.drain(0..packet_size);
            } else {
                break;
            }
        }

        Ok(processed)
    }

    /// 获取数据包大小
    fn get_packet_size(&self, data: &[u8]) -> Option<usize> {
        if data.len() < 4 {
            return None;
        }

        // 尝试两种字节序解析
        let little_endian_size = u32::from_le_bytes([data[0], data[1], data[2], data[3]]) as usize;
        let big_endian_size = u32::from_be_bytes([data[0], data[1], data[2], data[3]]) as usize;

        // 判断哪种字节序更合理
        let (size, _endian) = if self.is_valid_size(little_endian_size) {
            (little_endian_size, "Little Endian")
        } else if self.is_valid_size(big_endian_size) {
            (big_endian_size, "Big Endian")
        } else {
            eprintln!("警告: 两种字节序解析的包大小均不合理");
            return None;
        };

        // println!("使用 {} 解析包大小: {}", endian, size);
        Some(size)
    }

    fn is_valid_size(&self, size: usize) -> bool {
        // 根据实际协议调整合理范围
        size >= 100 && size <= 4096
    }

    /// 解析单个数据包
    fn parse_packet(&self, data: &[u8]) -> Result<RobotDataPacket> {
        RobotDataPacket::from_bytes(data)
    }
}
