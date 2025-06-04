const gur = (...args: (string | number)[][]) => {
    let aggregate: string[] = []
    for (const v of args) {
        const [unit, len] = v
        aggregate = aggregate.concat(new Array(+len).fill(unit))
    }
    return aggregate
}

export const isJointParam = (param: string) => {
    return JOINT_FIELDS.includes(param)
}


// 关节的字段
const JOINT_FIELDS = [
    'xarm_target_joint_positions',
    'xarm_target_joint_velocities',
    'xarm_target_joint_accelerations',
    'xarm_actual_joint_positions',
    'xarm_actual_joint_velocities',
    'xarm_actual_joint_accelerations',
    'xarm_actual_joint_currents',
    'xarm_estimated_joint_torques',
    'xarm_joint_temperatures',
]

// 分析关节的字段 analysis
const ANALYSIS_JOINT_FIELDS = [
    "xarm_target_joint_positions@xarm_actual_joint_positions",
    "xarm_target_joint_velocities@xarm_actual_joint_velocities",
    "xarm_target_joint_accelerations@xarm_actual_joint_accelerations",
]
// 分析tcp位置
const ANALYSIS_TCP_POSITION_FIELDS = [
    "xarm_actual_tcp_pose@xarm_target_tcp_pose",
    "xarm_actual_tcp_speed@xarm_target_tcp_speed",
]

// TCP的字段
const TCP_POSITION_FIELD = [
    'xarm_target_tcp_pose',
    'xarm_target_tcp_speed',
    'xarm_actual_tcp_pose',
    'xarm_actual_tcp_speed',
]
// 力矩的字段
const MOMENT_POSITION_FIELD = [
    'xarm_estimated_tcp_torques',
    'xraw_data_torque_sensor',
    'filtered_data_torque_sensor',
]

// 关节速度位置电流单位
export const ARM_JOINT_TYPE_UNIT = {
    // 分析的关节位置 和规划的关节位置
    'xarm_target_joint_positions@xarm_actual_joint_positions': gur(['rad', 8]),
    // 分析的关节速度 和规划的关节速度
    'xarm_target_joint_velocities@xarm_actual_joint_velocities': gur(['rad/s', 8]),
    // 分析的关节加速度 和规划的关节加速度
    'xarm_target_joint_accelerations@xarm_actual_joint_accelerations': gur(['rad/s²', 8]),
    // 分析的TCP位置 和规划的TCP位置
    'xarm_actual_tcp_pose@xarm_target_tcp_pose': gur(['mm', 3], ['rad', 3]),
    // 分析的TCP速度 和规划的TCP速度
    'xarm_actual_tcp_speed@xarm_target_tcp_speed': gur(['mm/s', 3], ['rad/s', 3]),
    // 规划关节位置
    'xarm_target_joint_positions': gur(['rad', 8]),
    // 规划关节速度
    'xarm_target_joint_velocities': gur(['rad/s', 8]),
    // 规划关节加速度
    'xarm_target_joint_accelerations': gur(['rad/s²', 8]),
    // 实际关节位置
    'xarm_actual_joint_positions': gur(['rad', 8]),
    // 实际关节速度
    'xarm_actual_joint_velocities': gur(['rad/s', 8]),
    // 实际关节加速度
    'xarm_actual_joint_accelerations': gur(['rad/s²', 8]),
    // 实际关节电流
    'xarm_actual_joint_currents': gur(['A', 8]),
    // 电流估算的关节力矩
    'xarm_estimated_joint_torques': gur(['N·m', 8]),
    // 规划TCP位置
    'xarm_target_tcp_pose': gur(['mm', 3], ['rad', 3]),
    // 规划TCP速度
    'xarm_target_tcp_speed': gur(['mm/s', 3], ['rad/s', 3]),
    // 实际TCP位置
    'xarm_actual_tcp_pose': gur(['mm', 3], ['rad', 3]),
    // 实际TCP速度
    'xarm_actual_tcp_speed': gur(['mm/s', 3], ['rad/s', 3]),
    // 电流估算的TCP力矩
    'xarm_estimated_tcp_torques': gur(['N', 3], ['N·m', 3]),
    // 力矩传感器(原始值)
    'xraw_data_torque_sensor': gur(['N', 3], ['N·m', 3]),
    // 力矩传感器(滤波值)
    'filtered_data_torque_sensor': gur(['N', 3], ['N·m', 3]),
    // 关节温度
    'xarm_joint_temperatures': gur(['℃', 8]),
    'response_subtract_data': gur(['rad', 8]),
}

export const MODE_JOINT_TYPE = Object.keys(ARM_JOINT_TYPE_UNIT) as (keyof typeof ARM_JOINT_TYPE_UNIT)[]
// 关节 options
export const JOINT_UNIT_OPTIONS = [
    { value: '0', label: 'J1' },
    { value: '1', label: 'J2' },
    { value: '2', label: 'J3' },
    { value: '3', label: 'J4' },
    { value: '4', label: 'J5' },
    { value: '5', label: 'J6' },
    { value: '6', label: 'J7' },
    { value: '7', label: 'J8' },
]
// tcp options
export const TCP_UNIT_OPTIONS = [
    { value: '0', label: 'X' },
    { value: '1', label: 'Y' },
    { value: '2', label: 'Z' },
    { value: '3', label: 'Rx' },
    { value: '4', label: 'Ry' },
    { value: '5', label: 'Rz' },
]
// 力矩options
export const MOMENT_UNIT_OPTIONS = [
    { value: '0', label: 'Fx' },
    { value: '1', label: 'Fy' },
    { value: '2', label: 'Fz' },
    { value: '3', label: 'Tx' },
    { value: '4', label: 'Ty' },
    { value: '5', label: 'Tz' },
]

// 显示rad弧度的字段
export const SHOW_RAD_TYPE = [
    'xarm_target_joint_positions',
    'xarm_target_joint_velocities',
    'xarm_target_joint_accelerations',
    'xarm_actual_joint_positions',
    'xarm_actual_joint_velocities',
    'xarm_actual_joint_accelerations',
    'xarm_target_tcp_pose',
    'xarm_target_tcp_speed',
    'xarm_actual_tcp_pose',
    'xarm_actual_tcp_speed',
    'xarm_target_joint_positions@xarm_actual_joint_positions',
    'xarm_target_joint_velocities@xarm_actual_joint_velocities',
    'xarm_target_joint_accelerations@xarm_actual_joint_accelerations',
    'xarm_actual_tcp_pose@xarm_target_tcp_pose',
    'xarm_actual_tcp_speed@xarm_target_tcp_speed'
]
// 关节的字段
export const optionsCorrespondingToParameters = (paramsType: keyof typeof ARM_JOINT_TYPE_UNIT): DefaultOptionType[] => {
    // 分析
    if (ANALYSIS_JOINT_FIELDS.includes(paramsType)) {
        return JOINT_UNIT_OPTIONS
    }
    if (ANALYSIS_TCP_POSITION_FIELDS.includes(paramsType)) {
        return TCP_UNIT_OPTIONS
    }
    // 观测
    if (JOINT_FIELDS.includes(paramsType)) {
        return JOINT_UNIT_OPTIONS
    }

    if (TCP_POSITION_FIELD.includes(paramsType)) {
        return TCP_UNIT_OPTIONS
    }

    if (MOMENT_POSITION_FIELD.includes(paramsType)) {
        return MOMENT_UNIT_OPTIONS
    }
    return []
}


export const LANGUAGE_OPTIONS = [
    { value: 'zh-CN', label: '中文' },
    { value: 'en-US', label: 'English' },
]

export const SELECTED_FIELD = {
    joint: '',
    jointType: 'xarm_target_joint_positions',
    hz: '200',
    type: "0",
    unit: '0'
}


// 模型对应的关节数量
export const ARM_MODEL_JOINT = {
    '': 0,
    'xarm3': 3,
    'xarm4': 4,
    'xarm5': 5,
    'xarm6': 6,
    'xarm7': 7,
    'xarm8': 8,
    'lite6': 6,
    'lite7': 7,
    'lite8': 8,
}

export type DefaultOptionType = {
    value: string,
    label: string
}

export type ChartJointValueMap = Partial<Record<keyof typeof ARM_JOINT_TYPE_UNIT | 'response_subtract_data', number[]>>
export type JointValueKey = Partial<keyof typeof ARM_JOINT_TYPE_UNIT | 'response_subtract_data'>
