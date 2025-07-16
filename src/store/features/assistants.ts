import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { save } from "@tauri-apps/plugin-dialog";
import { downloadDir, join, basename, dirname } from '@tauri-apps/api/path';
import dayjs from "dayjs";


import { RootState } from "..";
import i18n from "@/lib/i18n";
import { toast } from "sonner";
import { sleep } from "@/lib/utils";
import { ChartWorker } from "@/lib/worker";
import { OPTION_EMPTY } from "@/lib/constant";
import { invoke } from "@tauri-apps/api/core";

type Response<T> = {
    code: number,
    msg: string,
    id: string,
    data: T,
    type: string,
}
const worker = ChartWorker.getInstance()
export const SELECTED_FIELD = {
    joint_dir: OPTION_EMPTY,                    // 观测的关节
    observe_type: 'target_joint_positions',     // 观测的字段
    hz: 'hz250',                                // 采样频率        
    csv: false,                                 // 是否保存为csv文件
    observer: false,                            // 是否开启观测
    type: "0",
    unit: 'degree',                             // 单位
    time: 100,                                  // 超时时间
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
    const { filter_field, reporting } = (getState() as RootState).assistants as AssistantsState
    await sleep(300)
    return new Promise(async (resolve) => {
        try {
            if (reporting) {
                invoke("stop_assistant").then((res: any) => {
                    resolve({ ...res, data: { target: 'stop' } })
                })
                // ws.send('stop_status_report', {
                //     save_path: "",
                //     file_name: ""
                // }).then((res) => {
                //     resolve({ ...res, data: { target: 'stop' } })
                // })
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
                timeout: filter_field.time,
                csv: false,
            }
            worker.postMessage({
                type: "set_joint_object",
                value: filter_field.observe_type,
            });
            worker.postMessage({ type: "update", value: true });
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
                    // @ts-ignore
                    const save_path = await dirname(path!)
                    // @ts-ignore
                    const file_name = await basename(path!)
                    // ws.send('stop_status_report', {
                    //     save_path,
                    //     file_name
                    // }).then((res) => {
                    //     resolve({ ...res, data: { target: 'stop' } })
                    // })
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
        reporting: false,
        useRad: true,
        filter_field: SELECTED_FIELD,
        sixDof: false, // 六维力矩的hz是200hz， 其它是250hz
        show_download_btn: false, // 显示下载按钮
    },
    reducers: {
        setCurJoint: (state, action) => {
            state.curJoint = action.payload.value
        },
        setReporting: (state, action) => {
            state.reporting = action.payload.value
        },
        setUseRad: (state, action) => {
            state.useRad = action.payload.value
        },
        setJointType: (state, action) => {
            state.filter_field.observe_type = action.payload.value
        },
        setSelectedField: (state, action) => {
            const { joint_dir, observe_type, hz, type, unit, time, mode, compare } = action.payload
            // 设置角度/弧度
            if (unit !== state.filter_field.unit) {
                worker.postMessage({ type: "set_rad_unit", value: unit });
                worker.postMessage({ type: "clear_joints", value: null });
            }

            if (joint_dir !== state.filter_field.joint_dir) {
                worker.postMessage({ type: "set_current_joint", value: joint_dir });
            }

            if (observe_type !== state.filter_field.observe_type) {
                worker.postMessage({ type: "set_joint_type", value: observe_type });
                worker.postMessage({ type: "clear_joints", value: null });
            }

            if (joint_dir !== state.filter_field.joint_dir || state.filter_field.compare !== compare || state.filter_field.unit !== unit) {
                worker.postMessage({
                    type: "post_chart_data",
                    value: joint_dir,
                })
            }

            state.filter_field.joint_dir = joint_dir
            state.filter_field.observe_type = observe_type
            state.filter_field.hz = hz
            state.filter_field.type = type
            state.filter_field.unit = unit
            state.filter_field.time = time
            state.filter_field.compare = compare

            if (mode !== state.filter_field.mode) {
                state.filter_field.mode = mode
                state.filter_field.observe_type = (mode === "observer" ? 'target_joint_positions' : 'analysis_joint_positions')
                worker.postMessage({ type: "set_joint_type", value: state.filter_field.observe_type });
                worker.postMessage({ type: "clear_joints", value: null });
            }

            state.curJoint = joint_dir
            state.useRad = unit === "1"
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

            const { code, data } = action.payload as any
            if (code === 0) {
                console.log("Observe 开始")
                state.reporting = data.target === 'start'
            } else {
                toast.error(i18n.t("operation_failed"))
            }

            if (!state.reporting && ["2", "3"].includes(state.filter_field.type)) {
                state.show_download_btn = true
            } else {
                state.show_download_btn = false
            }
        })

        builder.addCase(getSixDof.fulfilled, (state, action) => {
            const { code, data } = action.payload as any
            if (code === 0) {
                state.sixDof = data !== 0
                state.filter_field.hz = data !== 0 ? '200' : '250'
            }
        })

    }
})

export default slice.reducer

export type AssistantsState = ReturnType<typeof slice.getInitialState>;
export const {
    setCurJoint,
    setReporting,
    setUseRad,
    setJointType,
    setSelectedField
} = slice.actions