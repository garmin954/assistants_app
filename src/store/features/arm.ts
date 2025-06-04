import { Response, ws } from "@/pages/Layouts/SocketState/ws";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "..";
import { toast } from "sonner";
import { sleep } from "@/lib/utils";

export const switchConnectArm = createAsyncThunk<Response<unknown>, { force_disconnect?: boolean }>('arm/connectArm', async (data, { getState, }) => {
    const { connected, ip } = (getState() as RootState).arm
    await sleep(300)
    const cmd = data.force_disconnect || connected
        ? "xarm_disconnect"
        : "xarm_connect";

    const response = await ws.send(cmd, {
        ip
    })
    return response;
})


export const setArmStateApis = createAsyncThunk<Response<unknown>, { cmd: string }>('arm/setArmStateApis', async (args, { dispatch }) => {
    dispatch({
        type: 'arm/setApiLoading',
        payload: { api: args.cmd, loading: true }
    })

    let data = {}
    let cmd = args.cmd
    if (cmd.startsWith('send_cmd')) {
        const res = cmd.split("&")
        cmd = res[0]
        data = { cmd: res[1] }
    }
    const response = await ws.send(cmd, data).finally(() => {
        dispatch({
            type: 'arm/setApiLoading',
            payload: { api: args.cmd, loading: false }
        })
    });

    return response;
})


export const setArmMode = createAsyncThunk<Response<unknown>, string>('arm/setArmMode', async (mode) => {
    return await ws.send("xarm_switch_mode", {
        mode,
    })
})


const DefaultInfo = {
    firmware_version: "N/A",
    pwr_version: "N/A",
    robot_sn: "N/A",
    safe_version: "N/A",
    servo_version: "N/A",
    tgpio_version: "N/A",
    xarm_type: "N/A"
}

const slice = createSlice({
    // 标记 slice，作为 action.type 的前缀
    name: 'arm',
    // state 的初始值
    initialState: {
        ip: '192.168.1.',
        connected: false,
        loading: false,
        info: DefaultInfo,
        stateApis: {
            arm_mode: {
                label: "手臂模式",
                loading: false,
                className: "row-span-1",
                active: "0",
            },
            emergency_stop: {
                label: "紧急停止",
                loading: false,
                className: "row-span-2 h-full",
            },
            set_co0_high: {
                label: "设置CO0高",
                loading: false,
                className: "",
            },
            init_xarm: {
                label: "使能机械臂",
                loading: false,
                className: "",
            },
            move_gohome: {
                label: "回零点",
                loading: false,
                className: "",
            },

            "send_cmd&H106": {
                label: "伺服状态",
                loading: false,
                className: "",
            },
            "send_cmd&H16": {
                label: "清除错误",
                loading: false,
                className: "",
            },
            "goto_init_pos": {
                label: "安装位置",
                loading: false,
                className: "",
            },
            "goto_bio_catch_pos": {
                label: "BIO夹取位置",
                loading: false,
                className: "",
            },
        }
    },
    reducers: {
        setArmIp(state, action) {
            state.ip = action.payload
        },

        setApiLoading(state, { payload }) {
            const { api, loading } = payload
            if (api in state.stateApis) {
                state.stateApis[api as keyof typeof state.stateApis].loading = loading
            }
        },

        setConnectState(state, action) {
            state.connected = action.payload
        },

        setArmModeState(state, action) {
            state.stateApis.arm_mode.active = action.payload
        },
    },
    extraReducers(builder) {
        /******************** 连接机械臂 *********************/
        builder.addCase(switchConnectArm.pending, (state,) => {
            state.loading = true
        })
        builder.addCase(switchConnectArm.rejected, (state,) => {
            state.loading = false
        })
        builder.addCase(switchConnectArm.fulfilled, (state, action) => {
            state.loading = false
            // const { force_disconnect } = action.meta.arg
            const response = action.payload as Response<any>

            if (response.code === 0) {
                state.info = response.data || DefaultInfo
                // state.connected = force_disconnect ? false : !state.connected
                return;
            }

            if (response.code === 1) {
                // toast.info("重复连接！", {
                //     position: "top-center",
                //     duration: 2000,
                // });
                // state.connected = true
                return;
            }

            toast.error("失败 " + (response.data || ""), {
                position: "top-center",
            });
        })


        /******************** 其它接口操作 *********************/
        builder.addCase(setArmStateApis.fulfilled, (state, action) => {
            const response = action.payload as Response<any>
            const { cmd } = action.meta.arg
            const btnOpt = state.stateApis[cmd as keyof typeof state.stateApis]

            if (cmd === "init_xarm") {
                return
            }

            if (response.code === 0) {
                toast.success(btnOpt.label + "-成功", {
                    position: "top-center",
                });
                return
            }

            toast.error(btnOpt.label + "-失败 " + (response.data || ""), {
                position: "top-center",
            });
        })

        /******************** 设置手臂模式 *********************/
        builder.addCase(setArmMode.fulfilled, (state, action) => {
            const mode = action.meta.arg
            const response = action.payload as Response<any>
            if (response.code === 0) {
                // toast.success("设置手臂模式-成功");
                state.stateApis.arm_mode.active = mode
                return
            }
            toast.error("设置手臂模式-失败 " + (response.data || ""));
        })
    },
})

export default slice.reducer

export type ArmState = ReturnType<typeof slice.getInitialState>;
export const { setArmIp, setApiLoading, setConnectState, setArmModeState } = slice.actions