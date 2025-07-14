import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

import AppReducer, { AppState } from './features/app'
import UpdaterReducer, { UpdaterState } from './features/updater'
import AssistantsReducer, { AssistantsState } from './features/assistants'
import WsReducer, { WsState } from './features/ws'

// 合并多个模块
const reducer = combineReducers({
    app: AppReducer,
    updater: UpdaterReducer,
    assistants: AssistantsReducer,
    ws: WsReducer
})


const store = configureStore({
    // 将导出的 slice 中的 reducer 传入，合并多个slice切片
    reducer,
    middleware: getDefaultMiddleware => getDefaultMiddleware({
        serializableCheck: false
    })

})

export type RootState = {
    app: AppState,
    updater: UpdaterState,
    assistants: AssistantsState,
    ws: WsState
}
export type RootDispatch = typeof store.dispatch;
export default store;