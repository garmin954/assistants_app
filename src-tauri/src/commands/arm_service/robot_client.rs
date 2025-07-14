use crate::commands::arm_service::connection::RobotConnection;
use crate::commands::arm_service::parser::Parser;
use crate::commands::arm_service::robot_data::RobotDataPacket;
use crate::commands::arm_service::structs::{
    ChartData, Mode, ObserveParams, ObserveType, ResponseChartData,
};
use chrono::{DateTime, Local};
use std::io::{self, Result};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, RwLock};
use std::time::{Duration, Instant};

/// 机器人客户端：封装连接管理和数据采集逻辑
#[derive(Debug)]
pub struct RobotClient {
    connection: Option<RobotConnection>,
    buffer_size: usize,
    parser: Parser,
    is_running: Arc<AtomicBool>,
}

impl RobotClient {
    /// 初始化机器人客户端
    pub fn new(ip_addr: String) -> Result<Self> {
        let read_timeout: u64 = 1000;
        let buffer_size: usize = 1024;

        let connection = Some(RobotConnection::connect(ip_addr, read_timeout)?);
        Ok(Self {
            connection,
            buffer_size,
            parser: Parser::new(),
            is_running: Arc::new(AtomicBool::new(false)),
        })
    }

    /// 启动数据采集循环
    pub fn collect_data<F>(
        &mut self,
        stop_flag: Arc<AtomicBool>,
        observer_running: Arc<AtomicBool>,
        observe_params: Arc<RwLock<ObserveParams>>,
        mut handler: F,
    ) -> Result<()>
    where
        F: FnMut(Result<ResponseChartData>) -> Result<()>,
    {
        // 检查连接是否存在
        let connection = self
            .connection
            .as_mut()
            .ok_or_else(|| io::Error::new(io::ErrorKind::NotConnected, "未连接到机器人"))?;

        self.is_running.store(true, Ordering::Relaxed);
        let mut buffer = vec![0u8; self.buffer_size];
        let mut incomplete_data = Vec::new();
        let mut packet_count = 0;

        println!("开始采集机器人数据...");

        let mut last_exec_time = Instant::now();

        while !stop_flag.load(Ordering::Relaxed) {
            // 读取数据
            match connection.read(&mut buffer) {
                Ok(bytes_read) => {
                    if bytes_read == 0 {
                        println!("连接已关闭，采集结束");
                        break;
                    }
                    // 添加到缓冲区
                    incomplete_data.extend_from_slice(&buffer[0..bytes_read]);
                    // println!(
                    //     "读取到 {} 字节数据，当前缓冲区大小: {}",
                    //     bytes_read,
                    //     incomplete_data.len()
                    // );

                    // 处理完整数据包
                    let processed =
                        self.parser
                            .process_packets(&mut incomplete_data, |packet| {
                                packet_count += 1;
                                if observer_running.load(Ordering::Relaxed) {
                                    // 检查是否需要执行handler
                                    // let exec_interval = Duration::from_secs_f32(1.0 / 250 as f32);
                                    // let elapsed = last_exec_time.elapsed();
                                    // if elapsed >= exec_interval {
                                    //     last_exec_time = Instant::now();
                                    //     let rp = process_chart_data(observe_params.clone(), packet);
                                    //     handler(rp)?;
                                    // }
                                    let rp = process_chart_data(observe_params.clone(), packet);
                                    handler(rp)?;
                                }
                                Ok(())
                            })?;

                    if processed == 0 && incomplete_data.len() > self.buffer_size * 2 {
                        eprintln!("警告：缓冲区数据过大，可能存在解析错误，清空缓冲区");
                        incomplete_data.clear();
                    }
                }
                Err(e) => {
                    if self.is_running.load(Ordering::Relaxed) {
                        eprintln!("读取数据错误: {}", e);
                        // 可以选择在这里实现重连逻辑
                        return Err(e);
                    } else {
                        // 正常关闭时忽略错误
                        break;
                    }
                }
            }
        }

        // let duration = start_time.elapsed().as_secs_f64();
        // println!(
        //     "采集完成，共处理 {} 个数据包，耗时 {:.2} 秒",
        //     packet_count, duration
        // );
        self.is_running.store(false, Ordering::Relaxed);
        Ok(())
    }

    /// 断开与机器人的连接
    pub fn disconnect(&mut self) -> Result<()> {
        if self.connection.is_some() {
            println!("断开与机器人的连接...");
            if let Some(conn) = self.connection.as_mut() {
                let _ = conn.close();
            }
            self.connection = None; // 释放连接资源
            println!("已成功断开连接");
            self.is_running.store(false, Ordering::Relaxed);
        }

        Ok(())
    }

    /// 检查连接状态
    pub fn is_connected(&self) -> bool {
        self.connection.is_some()
    }
}

// 实现 Drop trait，确保资源被正确释放
impl Drop for RobotClient {
    fn drop(&mut self) {
        // 如果连接还存在，则断开连接
        if self.is_connected() {
            let _ = self.disconnect();
        }
    }
}
/// 处理频率 5hz / 250hz
// pub fn process_packet_frequency(observe_params: &ObserveParams) -> usize {}
/// 处理图表数据
pub fn process_chart_data(
    // app_handle: &tauri::AppHandle,
    observe_params: Arc<RwLock<ObserveParams>>,
    packet: &RobotDataPacket,
) -> Result<ResponseChartData> {
    let op = match observe_params.read() {
        Ok(op) => op,
        Err(_) => {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "无法读取观测参数",
            ));
        }
    };

    // op.mode 观测模式
    let choose_ot = match op.mode {
        Mode::Observer => {
            vec![op.observe_type]
        }
        Mode::Analysis => {
            let observe_types = match op.observe_type {
                ObserveType::AnalysisJointPositions => {
                    vec![
                        ObserveType::ActualJointPositions,
                        ObserveType::TargetJointPositions,
                    ]
                }
                ObserveType::AnalysisJointVelocities => {
                    vec![
                        ObserveType::ActualJointVelocities,
                        ObserveType::TargetJointVelocities,
                    ]
                }
                ObserveType::AnalysisJointAccelerations => {
                    vec![
                        ObserveType::ActualJointAccelerations,
                        ObserveType::TargetJointAccelerations,
                    ]
                }
                ObserveType::AnalysisTcpPositions => {
                    vec![ObserveType::ActualTcpPose, ObserveType::TargetTcpPos]
                }
                ObserveType::AnalysisTcpVelocities => {
                    vec![
                        ObserveType::ActualTcpVelocity,
                        ObserveType::TargetTcpVelocities,
                    ]
                }
                _ => {
                    return Err(io::Error::new(
                        io::ErrorKind::InvalidData,
                        "无法读取观测参数",
                    ));
                }
            };
            observe_types
        }
    };

    let mut data: Vec<ChartData> = vec![];
    for ot in choose_ot {
        let value = match ot {
            ObserveType::ActualJointPositions => packet.actual_joint_positions.clone(),
            ObserveType::TargetJointPositions => packet.target_joint_positions.clone(),
            ObserveType::ActualJointVelocities => packet.actual_joint_velocities.clone(),
            ObserveType::TargetJointVelocities => packet.target_joint_velocities.clone(),
            ObserveType::ActualJointAccelerations => packet.actual_joint_accelerations.clone(),
            ObserveType::TargetJointAccelerations => packet.target_joint_accelerations.clone(),
            _ => {
                return Err(io::Error::new(
                    io::ErrorKind::InvalidData,
                    "无法读取观测参数",
                ));
            }
        };

        let chart_data = ChartData {
            data_type: ot,
            value,
        };

        data.push(chart_data);
    }

    // 本地时间
    let datetime_local: DateTime<Local> = Local::now();
    let date = datetime_local.format("%Y-%m-%d %H:%M:%S").to_string();

    let s = ResponseChartData {
        data,
        date: date.clone(),
    };

    // println!("{:?}", packet);
    Ok(s)
}
