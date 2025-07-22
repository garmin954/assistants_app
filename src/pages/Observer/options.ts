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
    'target_joint_positions',
    'target_joint_velocities',
    'target_joint_accelerations',
    'actual_joint_positions',
    'actual_joint_velocities',
    'actual_joint_accelerations',
    'actual_joint_currents',
    'estimated_joint_torque',
    'xarm_joint_temperatures',
]

// 分析关节的字段 analysis
const ANALYSIS_JOINT_FIELDS = [
    "analysis_joint_positions",
    "analysis_joint_velocities",
    "analysis_joint_accelerations",
]
// 分析tcp位置
const ANALYSIS_TCP_POSITION_FIELDS = [
    "analysis_tcp_positions",
    "analysis_tcp_velocities",
]

// TCP的字段
const TCP_POSITION_FIELD = [
    'target_tcp_pose',
    'target_tcp_velocity',
    'actual_tcp_pose',
    'actual_tcp_velocity',
]
// 力矩的字段
const MOMENT_POSITION_FIELD = [
    'estimated_tcp_torque',
    'data_torque_sensor',
    'filtered_data_torque_sensor',
]

// 关节速度位置电流单位
export const ARM_JOINT_TYPE_UNIT = {
    // 分析的关节位置 和规划的关节位置
    'analysis_joint_positions': gur(['rad', 8]),
    // 分析的关节速度 和规划的关节速度
    'analysis_joint_velocities': gur(['rad/s', 8]),
    // 分析的关节加速度 和规划的关节加速度
    'analysis_joint_accelerations': gur(['rad/s²', 8]),
    // 分析的TCP位置 和规划的TCP位置
    'analysis_tcp_positions': gur(['mm', 3], ['rad', 3]),
    // 分析的TCP速度 和规划的TCP速度
    'analysis_tcp_velocities': gur(['mm/s', 3], ['rad/s', 3]),
    // 规划关节位置
    'target_joint_positions': gur(['rad', 8]),
    // 规划关节速度
    'target_joint_velocities': gur(['rad/s', 8]),
    // 规划关节加速度
    'target_joint_accelerations': gur(['rad/s²', 8]),
    // 实际关节位置
    'actual_joint_positions': gur(['rad', 8]),
    // 实际关节速度
    'actual_joint_velocities': gur(['rad/s', 8]),
    // 实际关节加速度
    'actual_joint_accelerations': gur(['rad/s²', 8]),
    // 实际关节电流
    'actual_joint_currents': gur(['A', 8]),
    // 电流估算的关节力矩
    'estimated_joint_torque': gur(['N·m', 8]),
    // 规划TCP位置
    'target_tcp_pose': gur(['mm', 3], ['rad', 3]),
    // 规划TCP速度
    'target_tcp_velocity': gur(['mm/s', 3], ['rad/s', 3]),
    // 实际TCP位置
    'actual_tcp_pose': gur(['mm', 3], ['rad', 3]),
    // 实际TCP速度
    'actual_tcp_velocity': gur(['mm/s', 3], ['rad/s', 3]),
    // 电流估算的TCP力矩
    'estimated_tcp_torque': gur(['N', 3], ['N·m', 3]),
    // 力矩传感器(原始值)
    'data_torque_sensor': gur(['N', 3], ['N·m', 3]),
    // 力矩传感器(滤波值)
    'filtered_data_torque_sensor': gur(['N', 3], ['N·m', 3]),
    // 关节温度
    'xarm_joint_temperatures': gur(['℃', 8]),
    'difference_data': gur(['rad', 8]),
}
export type JDS = 'jd1' | 'jd2' | 'jd3' | 'jd4' | 'jd5' | 'jd6' | 'jd7'

export const MODE_JOINT_TYPE = Object.keys(ARM_JOINT_TYPE_UNIT) as (keyof typeof ARM_JOINT_TYPE_UNIT)[]
// 关节 options
export const JOINT_UNIT_OPTIONS = [
    { value: 'jd1', label: 'J1' },
    { value: 'jd2', label: 'J2' },
    { value: 'jd3', label: 'J3' },
    { value: 'jd4', label: 'J4' },
    { value: 'jd5', label: 'J5' },
    { value: 'jd6', label: 'J6' },
    { value: 'jd7', label: 'J7' },
    { value: 'jd8', label: 'J8' },
]
// tcp options
export const TCP_UNIT_OPTIONS = [
    { value: 'jd1', label: 'X' },
    { value: 'jd2', label: 'Y' },
    { value: 'jd3', label: 'Z' },
    { value: 'jd4', label: 'Rx' },
    { value: 'jd5', label: 'Ry' },
    { value: 'jd6', label: 'Rz' },
]
// 力矩options
export const MOMENT_UNIT_OPTIONS = [
    { value: 'jd1', label: 'Fx' },
    { value: 'jd2', label: 'Fy' },
    { value: 'jd3', label: 'Fz' },
    { value: 'jd4', label: 'Tx' },
    { value: 'jd5', label: 'Ty' },
    { value: 'jd6', label: 'Tz' },
]

// 显示rad弧度的字段
export const SHOW_RAD_TYPE = [
    'target_joint_positions',
    'target_joint_velocities',
    'target_joint_accelerations',
    'actual_joint_positions',
    'actual_joint_velocities',
    'actual_joint_accelerations',
    'target_tcp_pose',
    'target_tcp_velocity',
    'actual_tcp_pose',
    'actual_tcp_velocity',
    'analysis_joint_positions',
    'analysis_joint_velocities',
    'analysis_joint_accelerations',
    'analysis_tcp_positions',
    'analysis_tcp_velocities'
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

export type ChartJointValueMap = Partial<Record<keyof typeof ARM_JOINT_TYPE_UNIT | 'difference_data', number[]>>
export type JointValueKey = Partial<keyof typeof ARM_JOINT_TYPE_UNIT | 'difference_data'>
export type ObserveChartDate = Record<JDS, ChartJointValueMap>
export type ObserveTypeData = {
    type: keyof ChartJointValueMap,
    value: number[]
}


// 分析类型对应的字段
export function getObserveTypes(observeType: JointValueKey): JointValueKey[] {
    switch (observeType) {
        case "analysis_joint_positions":
            return [
                "target_joint_positions",
                "actual_joint_positions"
            ]
            break;
        case "analysis_joint_velocities":
            return [
                "target_joint_velocities",
                "actual_joint_velocities"
            ]
            break;
        case "analysis_joint_accelerations":
            return [
                "target_joint_accelerations",
                "actual_joint_accelerations"
            ]
            break;
        case "analysis_tcp_positions":
            return [
                "actual_tcp_pose",
                "target_tcp_pose"
            ]
            break;
        case "analysis_tcp_velocities":
            return [
                "target_tcp_velocity",
                "actual_tcp_velocity"
            ]
            break;
        default:
            return [observeType]
            break;
    }
}