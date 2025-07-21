import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { save } from "@tauri-apps/plugin-dialog";
import { downloadDir, join, } from '@tauri-apps/api/path';
import dayjs from "dayjs";


import { RootState } from "..";
import i18n from "@/lib/i18n";
import { toast } from "sonner";
import { sleep } from "@/lib/utils";
import { OPTION_EMPTY } from "@/lib/constant";
import { invoke } from "@tauri-apps/api/core";
import { AppState } from "./app";

type Response<T> = {
    code: number,
    msg: string,
    id: string,
    data: T,
    type: string,
}
export const SELECTED_FIELD = {
    joint_dir: OPTION_EMPTY,                    // 观测的关节
    observe_type: 'target_joint_positions',     // 观测的字段
    hz: 'hz250',                                // 采样频率        
    csv: false,                                 // 是否保存为csv文件
    observer: false,                            // 是否开启观测
    type: "0",
    unit: 'angle',                             // 单位
    timeout: 100,                               // 超时时间
    mode: 'observer',                           // 模式
    compare: "1",                               // 比较模式
}

// 连接服务
export const connectPortServer = createAsyncThunk<Response<unknown>, string>('assistants/connectPortServer', async (ip, { dispatch }) => {
    return new Promise(async (resolve, reject) => {
        try {
            invoke('connect_robot_server', {
                ipAddr: ip,
            }).then((res: any) => {
                if (res.code === 0) {
                    dispatch(getSixDof())
                }
                resolve(res)
            })
        }
        catch (error) {
            reject(error)
        }
    })

})

// 断开服务
export const disconnectPortServer = createAsyncThunk<Response<unknown>>('assistants/disconnectPortServer', async () => {
    return await invoke('disconnect_robot_server')
})


// 开始观测
export const switchObserveState = createAsyncThunk<Response<unknown>>('assistants/switchObserveState', async (_, { getState }) => {
    const { filter_field } = (getState() as RootState).assistants as AssistantsState
    const { shared_state: { observering } } = (getState() as RootState).app as AppState
    await sleep(300)
    return new Promise(async (resolve) => {
        try {
            if (observering) {
                invoke("stop_assistant").then((res: any) => {
                    resolve({ ...res, data: { target: 'stop' } })
                })
                return
            }

            // @ts-ignore
            const cmd = filter_field.mode === 'observer' ? 'start_status_report' : 'start_status_report_compare'
            const params = {
                mode: filter_field.mode,
                observe_type: filter_field.observe_type,
                joint_dir: filter_field.joint_dir,
                hz: filter_field.hz,
                unit: filter_field.unit,
                timeout: filter_field.timeout,
                csv: filter_field.csv,
            }

            console.log('params==>', params);

            return invoke("start_assistant", { params }).then((res: any) => {
                resolve({ ...res, data: { target: 'start' } })
            })

        } catch (error) {
            toast.error("error:" + error)
        }
    })

})

// 下载文件
export const downloadObserverFile = createAsyncThunk<Response<unknown>>('assistants/downloadFile', async () => {
    return new Promise(async (resolve) => {
        try {
            const fd = dayjs().format('YYYY_MM_DD_HHmmss')
            const dp = await downloadDir();
            const fn = `record_data_${fd}.csv`
            const defaultPath = await join(dp, fn)
            save({
                title: i18n.t('saveObservationData'),
                defaultPath,
                filters: [{
                    name: 'CSV Files',
                    extensions: ['csv']
                }]
            }).then(async (path) => {
                if (path) {
                    invoke('save_csv', {
                        path
                    }).then((res: any) => {
                        resolve(res)
                    })
                    return
                }
                resolve({ code: 1, msg: 'cancel', id: "", data: { target: 'stop' }, type: "" })
            })
            return
        } catch (error) {
            toast.error("error:" + error)
        }
    })
})

// 获取是否六维力矩
export const getSixDof = createAsyncThunk<Response<unknown>>('assistants/getSixDof', async () => {
    return invoke('xarm_get_ft_sensor_config')
})

// export const onAutoStopObserve = createAsyncThunk<Response<unknown>>('assistants/onAutoStopObserve', async (_, { dispatch }) => {
//     dispatch(switchObserveState())
// })




const slice = createSlice({
    name: 'assistants',
    // state 的初始值
    initialState: {
        server_state: false,
        curJoint: '',
        useRad: true,
        filter_field: SELECTED_FIELD,
        sixDof: false, // 六维力矩的hz是200hz， 其它是250hz
        show_download_btn: false, // 显示下载按钮
    },
    reducers: {
        setCurJoint: (state, action) => {
            state.curJoint = action.payload.value
        },
        setUseRad: (state, action) => {
            state.useRad = action.payload.value
        },
        setJointType: (state, action) => {
            state.filter_field.observe_type = action.payload.value
        },
        setSelectedField: (state, action) => {
            const { mode, observe_type, joint_dir, unit, hz, timeout, csv, observer, compare } = action.payload;

            // 设置角度/弧度 (仅当 unit 有值时执行)
            if (unit !== undefined && unit !== state.filter_field.unit) {

            }

            // 设置当前关节 (仅当 joint_dir 有值时执行)
            if (joint_dir !== undefined && joint_dir !== state.filter_field.joint_dir) {
            }

            // 设置关节类型 (仅当 observe_type 有值时执行)
            if (observe_type !== undefined && observe_type !== state.filter_field.observe_type) {

            }

            // 发送图表数据 (仅当相关字段有值且变化时执行)
            if (
                (joint_dir !== undefined && joint_dir !== state.filter_field.joint_dir) ||
                (unit !== undefined && state.filter_field.unit !== unit)
            ) {

            }

            // 更新状态字段 (仅当值不为 undefined 时)
            if (joint_dir !== undefined) state.filter_field.joint_dir = joint_dir;
            if (observe_type !== undefined) state.filter_field.observe_type = observe_type;
            if (hz !== undefined) state.filter_field.hz = hz;
            if (unit !== undefined) state.filter_field.unit = unit;
            if (timeout !== undefined) state.filter_field.timeout = timeout;
            if (csv !== undefined) state.filter_field.csv = csv;
            if (observer !== undefined) state.filter_field.observer = observer;
            if (compare !== undefined) state.filter_field.compare = compare;


            // 模式变更处理 (仅当 mode 有值时执行)
            if (mode !== undefined && mode !== state.filter_field.mode) {
                state.filter_field.mode = mode;
                state.filter_field.observe_type = mode === "observer" ? 'target_joint_positions' : 'analysis_joint_positions';

            }

            // 更新当前关节和单位标志 (仅当相关值有变化时)
            if (joint_dir !== undefined) state.curJoint = joint_dir;
            if (unit !== undefined) state.useRad = unit === "1";
        }
    },
    extraReducers(builder) {
        builder.addCase(connectPortServer.fulfilled, (state, action) => {
            const { code } = action.payload


            if (code === 0) {
                state.server_state = true
            } else {
                toast.error(i18n.t("connect_failed"))
            }
        })

        builder.addCase(disconnectPortServer.fulfilled, (state, action) => {
            const { code } = action.payload
            if (code === 0) {
                state.server_state = false
            }
        })

        builder.addCase(switchObserveState.fulfilled, (state, action) => {
            console.log('action===>', state.filter_field.type);
            const { code } = action.payload as any
            if (code === 0) {
                console.log("Observe 开始")
            } else {
                toast.error(i18n.t("operation_failed"))
            }
        })

        builder.addCase(getSixDof.fulfilled, (_state, action) => {
            const { code } = action.payload as any
            if (code !== 0) {
                toast.error(i18n.t("download_fail"))
            }
        })
    }
})

export default slice.reducer

export type AssistantsState = ReturnType<typeof slice.getInitialState>;
export const {
    setCurJoint,
    setUseRad,
    setJointType,
    setSelectedField
} = slice.actions