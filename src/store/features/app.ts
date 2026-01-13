import { createSlice } from "@reduxjs/toolkit";
import { createElement } from "react";



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

        shared_state: {
            axis: 0,
            ft_sensor: false,
            arm_conn: false,
            observering: false,
        }
    },
    reducers: {
        setTitleBar(state, action) {
            state.titleBar = action.payload
        },

        setSharedData(state, action) {
            const { arm_conn, axis, ft_sensor, observering } = action.payload;
            state.shared_state.arm_conn = arm_conn;
            state.shared_state.axis = axis;
            state.shared_state.ft_sensor = ft_sensor;
            state.shared_state.observering = observering;
        }

    }
})

export default slice.reducer

export type AppState = ReturnType<typeof slice.getInitialState>;
export const { setTitleBar, setSharedData } = slice.actions