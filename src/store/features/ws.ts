import { createSlice } from '@reduxjs/toolkit';

export const Debugging = {
    xarm_tcp_load: [0, [0, 0, 0]],             // 第一位是负载kg
    network_data_list: [0, 0, 0, 0, 0],          // 网络监测数据
    xarm_get_cgpio_digital: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //io数据 CO0-CO7和DO0-DO7数据
    xarm_gravity_direction: [0, 0],           // 安装方位
    xarm_joint_pose: [0, 0, 0, 0, 0, 0, 0],        // 关节角度
    xarm_joint_limit: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],  // 关节角度范围
    xarm_mode: 0,                            // 模式
    xarm_port_name: '',
    xarm_sn: '',
    xarm_state: 0,                          // 状态
    target_joint_position: [0],
    xarm_tcp_pose: [0, 0, 0, 0, 0, 0],            // 关节tcp位置
    xarm_type: '',
    xarm_version_number: '',
    xarm_is_axis_angle: false,                 // 是否非轴角度
    xarm_temperatures: [0, 0, 0, 0, 0, 0], // 关节温度
    xarm_is_show_axis_angle: false
}

export const WS = createSlice({
    name: 'ws',
    // 初始值
    initialState: {
        ws: null,
        status: 'Uninstantiated', // ws状态
        roboticArmStatus: -1,
        xArmInfo: {
            core_version: "",
            xarm_port_name: "",
            xarm_sn: "",
            xarm_type: "",
            xarm_version_number: "", // 固件版本
        },
        xarm_cgpio_states: [0, 0, 0, 0, 0, 0, 0],      // io数据 ，AO0-AO1在xarm_cgpio_states参数的第9位和第10位，CI0-CI7在第11位，DI0-DI7 12位
        ...Debugging
    },
    reducers: {
        setRoboticArmStatus(state, { payload }) {
            state.roboticArmStatus = payload.status
        },
        setStatus(state, { payload }) {
            state.status = payload.status
        },
        setWs(state, { payload }) {
            state.ws = payload.ws
        },
        setRoboticArmSystemInformation(state, { payload }) {
            state.xArmInfo = payload
        },
        setDebuggingData(state, { payload }) {
            for (const k in Debugging) {
                if (k in payload.data && k in state) {
                    // 网络监测暂停保持最后的数据
                    if (k === 'network_data_list') {
                        const d = payload.data[k].reduce((a: number, b: number) => a + b)
                        if (d === 0) {
                            continue
                        }
                    }
                    // equalAssignment(state, k, payload.data[k])
                }
            }
        },
    },
});

// 导出actions
export const { setRoboticArmStatus, setWs, setStatus, setRoboticArmSystemInformation } = WS.actions;
export type WsState = ReturnType<typeof WS.getInitialState>;
export default WS.reducer; // 导出reducer，在创建store时使用到
