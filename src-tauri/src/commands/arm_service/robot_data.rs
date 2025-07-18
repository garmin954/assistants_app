use byteorder::{LittleEndian, ReadBytesExt};
use std::io::{Cursor, Read};

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct RobotDataPacket {
    /// 字节数（ByteOffset: 1, ByteLength: 4, Type: U32）
    pub byte_count: u32,

    /// 时间戳（ByteOffset: 5, ByteLength: 8, Type: U64）μs
    pub timestamp: i64,

    /// 运动状态和模式（ByteOffset: 13, ByteLength: 1, Type: U8）
    pub motion_state_and_mode: u8,

    /// 指令缓存数（ByteOffset: 14, ByteLength: 2, Type: U16）
    pub instruction_cache_count: u16,

    /// 预留（用于系统信息）（ByteOffset: 16, ByteLength: 17, Type: U8[17]）
    pub reserved_system: [u8; 17],

    /// 目标关节位置（ByteOffset: 33, ByteLength: 28, Type: FP32[7]）rad
    pub target_joint_positions: [f32; 7],

    /// 目标关节速度（ByteOffset: 61, ByteLength: 28, Type: FP32[7]）rad/s
    pub target_joint_velocities: [f32; 7],

    /// 目标关节加速度（ByteOffset: 89, ByteLength: 28, Type: FP32[7]）rad/s²
    pub target_joint_accelerations: [f32; 7],

    /// 实际关节位置（ByteOffset: 117, ByteLength: 28, Type: FP32[7]）rad
    pub actual_joint_positions: [f32; 7],

    /// 实际关节速度（ByteOffset: 145, ByteLength: 28, Type: FP32[7]）rad/s
    pub actual_joint_velocities: [f32; 7],

    /// 实际关节加速度（ByteOffset: 173, ByteLength: 28, Type: FP32[7]）rad/s²
    pub actual_joint_accelerations: [f32; 7],

    /// 实际关节电流（ByteOffset: 201, ByteLength: 28, Type: FP32[7]）A
    pub actual_joint_currents: [f32; 7],

    /// 估算关节扭矩（ByteOffset: 229, ByteLength: 28, Type: FP32[7]）N·m
    pub estimated_joint_torque: [f32; 7],

    /// 预留（用于关节信息）（ByteOffset: 257, ByteLength: 168, Type: FP32[42]）
    pub reserved_joint: [f32; 42],

    /// 目标TCP位置与姿态（ByteOffset: 425, ByteLength: 24, Type: FP32[6]）mm & rad
    pub target_tcp_pose: [f32; 6],

    /// 目标TCP速度（ByteOffset: 449, ByteLength: 24, Type: FP32[6]）mm/s & rad/s
    pub target_tcp_velocity: [f32; 6],

    /// 实际TCP位置与姿态（ByteOffset: 473, ByteLength: 24, Type: FP32[6]）mm & rad
    pub actual_tcp_pose: [f32; 6],

    /// 实际TCP速度（ByteOffset: 497, ByteLength: 24, Type: FP32[6]）mm/s & rad/s
    pub actual_tcp_velocity: [f32; 6],

    /// 估算TCP扭矩（ByteOffset: 521, ByteLength: 24, Type: FP32[6]）N & N·m
    pub estimated_tcp_torque: [f32; 6],

    /// 预留（用于TCP信息）（ByteOffset: 545, ByteLength: 144, Type: FP32[36]）
    pub reserved_tcp: [f32; 36],

    /// 六维力矩传感器原始数据（ByteOffset: 689, ByteLength: 24, Type: FP32[6]）
    pub data_torque_sensor: [f32; 6],

    /// 滤波/负载/偏置补偿后末端六维力（ByteOffset: 713, ByteLength: 24, Type: FP32[6]）
    pub filtered_data_torque_sensor: [f32; 6],

    /// 预留（用于外部设备）（ByteOffset: 737, ByteLength: 48, Type: FP32[12]）
    pub reserved_external: [f32; 12],
}

impl RobotDataPacket {
    /// 从 785 字节数据中解析结构体
    pub fn from_bytes(data: &[u8]) -> std::io::Result<Self> {
        let mut cursor = Cursor::new(data);

        let byte_count = cursor.read_u32::<LittleEndian>()?;
        let timestamp = cursor.read_i64::<LittleEndian>()?;
        let motion_state_and_mode = cursor.read_u8()?;
        let instruction_cache_count = cursor.read_u16::<LittleEndian>()?;

        let mut reserved_system = [0u8; 17];
        cursor.read_exact(&mut reserved_system)?;

        let target_joint_positions = Self::read_f32_array::<7>(&mut cursor)?;
        let target_joint_velocities = Self::read_f32_array::<7>(&mut cursor)?;
        let target_joint_accelerations = Self::read_f32_array::<7>(&mut cursor)?;
        let actual_joint_positions = Self::read_f32_array::<7>(&mut cursor)?;
        let actual_joint_velocities = Self::read_f32_array::<7>(&mut cursor)?;
        let actual_joint_accelerations = Self::read_f32_array::<7>(&mut cursor)?;
        let actual_joint_currents = Self::read_f32_array::<7>(&mut cursor)?;
        let estimated_joint_torque = Self::read_f32_array::<7>(&mut cursor)?;

        let reserved_joint = Self::read_f32_array::<42>(&mut cursor)?;

        let target_tcp_pose = Self::read_f32_array::<6>(&mut cursor)?;
        let target_tcp_velocity = Self::read_f32_array::<6>(&mut cursor)?;
        let actual_tcp_pose = Self::read_f32_array::<6>(&mut cursor)?;
        let actual_tcp_velocity = Self::read_f32_array::<6>(&mut cursor)?;
        let estimated_tcp_torque = Self::read_f32_array::<6>(&mut cursor)?;

        let reserved_tcp = Self::read_f32_array::<36>(&mut cursor)?;
        let data_torque_sensor = Self::read_f32_array::<6>(&mut cursor)?;
        let filtered_data_torque_sensor = Self::read_f32_array::<6>(&mut cursor)?;
        let reserved_external = Self::read_f32_array::<12>(&mut cursor)?;

        Ok(Self {
            byte_count,
            timestamp,
            motion_state_and_mode,
            instruction_cache_count,
            reserved_system,
            target_joint_positions,
            target_joint_velocities,
            target_joint_accelerations,
            actual_joint_positions,
            actual_joint_velocities,
            actual_joint_accelerations,
            actual_joint_currents,
            estimated_joint_torque,
            reserved_joint,
            target_tcp_pose,
            target_tcp_velocity,
            actual_tcp_pose,
            actual_tcp_velocity,
            estimated_tcp_torque,
            reserved_tcp,
            data_torque_sensor,
            filtered_data_torque_sensor,
            reserved_external,
        })
    }

    /// 从 Cursor 中读取指定数量的 f32 数组
    fn read_f32_array<const N: usize>(cursor: &mut Cursor<&[u8]>) -> std::io::Result<[f32; N]> {
        let mut arr = [0.0f32; N];
        for i in 0..N {
            arr[i] = cursor.read_f32::<LittleEndian>()?;
        }
        Ok(arr)
    }
}
