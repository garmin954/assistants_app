import { createSelector, createSlice } from "@reduxjs/toolkit";
import { createElement } from "react";
import { RootState } from "..";

export const getWSState = createSelector(
    (state: RootState) => state.app, (state) => {
        return state.server.ws_status
    }
)

const slice = createSlice({
    // 标记 slice，作为 action.type 的前缀
    name: 'app',
    // state 的初始值
    initialState: {
        titleBar: {
            visible: false,
            title: "",
            theme: 'dark',
            extensions: createElement('div', {}, ''),
        },
        server: {
            server_status: true,
            ws_status: true,
            lack_config: false
        },
        realTime: {
            xarm_connected: false,
            xarm_mode: 0,
            xarm_state: 0,
        }
    },
    reducers: {
        setTitleBar(state, action) {
            state.titleBar = action.payload
        },
        setAppServerStatus(state, action) {
            const [server_state, config_exist] = action.payload

            state.server.server_status = server_state
            state.server.lack_config = !config_exist
        },
        setRealTimeState(state, action) {
            state.realTime = action.payload
        },
        setWSStatus(state, action) {
            state.server.ws_status = action.payload
        },

        setLackConfig(state, action) {
            state.server.lack_config = action.payload
        }
    }
})

export default slice.reducer

export type AppState = ReturnType<typeof slice.getInitialState>;
export const { setTitleBar, setAppServerStatus, setRealTimeState, setWSStatus, setLackConfig } = slice.actions