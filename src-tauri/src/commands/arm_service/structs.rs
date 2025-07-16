use serde::{Deserialize, Serialize};

// 使用枚举替代字符串表示固定值
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Mode {
    Observer,
    Analysis,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ObserveType {
    TargetJointPositions,       // 规划关节位置，rad，7个关节
    TargetJointVelocities,      // 规划关节速度，rad/s，7个关节
    TargetJointAccelerations,   // 规划关节加速度，rad/s^2，7个关节
    ActualJointPositions,       // 实际关节位置，rad，7个关节
    ActualJointVelocities,      // 实际关节速度，rad/s，7个关节
    ActualJointAccelerations,   // 实际关节加速度，rad/s^2，7个关节
    ActualJointCurrents,        // 实际关节电流，A，7个关节
    ActualJointTorques,         // 实际关节力矩，N*m，7个关节
    TargetTcpPos,               // 规划TCP位置，mm，6个坐标
    TargetTcpVelocities,        // 规划TCP速度，mm/s，6个坐标
    ActualTcpPose,              // 实际TCP位姿，mm，6个坐标
    ActualTcpVelocity,          // 实际TCP速度，mm/s，6个坐标
    EstimatedTcpTorque,         // 估计TCP力矩，N*m，6个坐标
    DataTorqueSensor,           // 力矩传感器原始6D力/力矩，N*m，6个坐标
    FilteredDataTorqueSensor,   // 力矩传感器滤波6D力/力矩，N*m，6个坐标
    AnalysisJointPositions,     // 分析关节位置
    AnalysisJointVelocities,    // 分析关节速度
    AnalysisJointAccelerations, // 分析关节加速度
    AnalysisTcpPositions,       // 分析TCP位置
    AnalysisTcpVelocities,      // 分析TCP速度
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Unit {
    Degree,
    Radian,
}

// 使用枚举的联合类型
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[repr(u8)] // 关键：使用 u8 表示，Serde 会自动序列化为整数
#[serde(rename_all = "lowercase")]
pub enum JointOrDirection {
    All = 0,
    JD1 = 1,
    JD2 = 2,
    JD3 = 3,
    JD4 = 4,
    JD5 = 5,
    JD6 = 6,
    JD7 = 7,
    JD8 = 8,
}

// 频率类型（限制为 5/200/250）
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[repr(u8)] // 关键：使用 u8 表示，Serde 会自动序列化为整数
#[serde(rename_all = "lowercase")]
pub enum Hertz {
    Hz5 = 5,
    Hz200 = 200,
    Hz250 = 250,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ObserveParams {
    pub mode: Mode,                  // 模式 观测（observer）/分析(analysis)
    pub observe_type: ObserveType,   // 观测类型 关节/位置/速度/力矩/力
    pub joint_dir: JointOrDirection, // 关节/方向
    pub unit: Unit,                  // 单位 角度/弧度
    pub hz: Hertz,                   // 频率 5/200/250
    pub timeout: u64,                // 超时时间
    pub csv: bool,                   // 是否保存为csv文件
}

impl Default for ObserveParams {
    fn default() -> Self {
        ObserveParams {
            mode: Mode::Observer,                            // 默认观测模式
            observe_type: ObserveType::TargetJointPositions, // 默认观测关节
            joint_dir: JointOrDirection::All,                // 默认观测第全部关节
            unit: Unit::Degree,                              // 默认角度单位
            hz: Hertz::Hz200,                                // 默认频率200Hz
            timeout: 5000,                                   // 默认超时5000ms
            csv: false,                                      // 默认不保存为csv文件
        }
    }
}

// {
//     "data": [{
//         "type": "ActualJointPositions",
//         "value": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
//     }],
//     "date": now,
//     "type": "ActualJointPositions",
// }

#[derive(Serialize, Deserialize, Debug)]
pub struct ChartData {
    #[serde(rename = "type")]
    pub data_type: ObserveType,
    pub value: Vec<f32>,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct ResponseChartData {
    pub data: Vec<ChartData>,
    pub date: String,
}
