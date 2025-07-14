use std::io::{self, Read};
use std::net::TcpStream;
use std::time::Duration;

/// 机器人连接管理
#[derive(Debug)]
pub struct RobotConnection {
    stream: TcpStream,
}

impl RobotConnection {
    /// 连接到机器人
    pub fn connect(ip_addr: String, read_timeout: u64) -> io::Result<Self> {
        let stream = TcpStream::connect(&ip_addr)?;
        stream.set_read_timeout(Some(Duration::from_secs(read_timeout)))?;
        println!("已成功连接到机器人: {}", ip_addr);
        Ok(Self { stream })
    }

    /// 从机器人读取数据
    pub fn read(&mut self, buffer: &mut [u8]) -> io::Result<usize> {
        self.stream.read(buffer)
    }

    // 关闭连接
    pub fn close(&mut self) -> io::Result<()> {
        self.stream.shutdown(std::net::Shutdown::Both)
    }
}

// 实现 Drop trait，在连接对象被销毁时关闭TCP流
impl Drop for RobotConnection {
    fn drop(&mut self) {
        println!("关闭TCP连接...");
        // TcpStream的析构函数会自动关闭连接
    }
}
