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

        sharedData: {
            axis: 0,
            ft_sensor: [0, 0],
            arm_conn: false
        }
    },
    reducers: {
        setTitleBar(state, action) {
            state.titleBar = action.payload
        },

        setSharedData(state, action) {
            const { arm_conn, axis, ft_sensor } = action.payload;

            state.sharedData.arm_conn = arm_conn;
            state.sharedData.axis = axis;
            state.sharedData.ft_sensor = ft_sensor;
        }

    }
})

export default slice.reducer

export type AppState = ReturnType<typeof slice.getInitialState>;
export const { setTitleBar, setSharedData } = slice.actions