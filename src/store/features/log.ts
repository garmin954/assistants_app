import { sleep } from "@/lib/utils";
import { Response, ws } from "@/pages/Layouts/SocketState/ws";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";


// hex转rgb
export function hexToRgb(hex: string) {
    // 移除可能存在的 # 符号
    hex = hex.replace(/^#/, "");

    // 将十六进制颜色值转换为 RGB 格式
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return [r, g, b];
}
export function hexDynamicColor(text: string, hex: string) {
    const color = hexToRgb(hex);
    // 使用 ANSI 转义码设置文字颜色
    const ansiColor = `\x1b[38;2;${color[0]};${color[1]};${color[2]}m`;
    // 写入带有动态颜色的文字
    return `${ansiColor}${text}\x1b[0m\r\n`;
}

export type LogState = { logs: string[], record: string, sendLoading: boolean, cmdsHistory: string[], cmdPointer: number }

export const sendCmdAction = createAsyncThunk<Response<unknown>, { cmd: string }>('log/sendCmd', async (data, { dispatch }) => {
    const { cmd } = data
    dispatch({ type: 'log/setSendLoading', payload: true })
    dispatch({ type: 'log/addLog', payload: { command: cmd, color: "" } })
    // dispatch(addLog(data))
    const response = await ws.send("send_cmd", {
        cmd
    }).finally(async () => {

        await sleep(300)
        dispatch({ type: 'log/setSendLoading', payload: false })
    })
    return response;
})

const slice = createSlice({
    name: 'log',
    initialState: {
        logs: [],
        record: "",
        sendLoading: false,
        cmdsHistory: localStorage.getItem("Cmds_History") ? JSON.parse(localStorage.getItem("Cmds_History") as string) : [],
        cmdPointer: 0,
    } as LogState,
    reducers: {
        addLog(state, action) {
            const { command, color = "" } = action.payload
            let cmd = command + "\r\n"
            if (color) {
                cmd = hexDynamicColor(command, color);
            }
            state.logs.push(cmd)
            state.record = cmd
        },
        clear(state) {
            state.logs = []
            state.record = ""
        },
        setSendLoading(state, action) {
            state.sendLoading = !!action.payload
        },
        pushCmdsHistory(state, action) {
            state.cmdPointer = 0
            // push 命令到cmds 并设置最大保存100条命令
            state.cmdsHistory.push(action.payload)
            if (state.cmdsHistory.length > 100) {
                state.cmdsHistory.shift()
            }
            // 将cmds存到缓存中
            localStorage.setItem("Cmds_History", JSON.stringify(state.cmdsHistory))
        },
        setCmdPointer(state, action) {
            state.cmdPointer = action.payload
        },
    },
})

export default slice.reducer
export const { addLog, clear, setSendLoading, pushCmdsHistory, setCmdPointer } = slice.actions
