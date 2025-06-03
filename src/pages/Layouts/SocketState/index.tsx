import { Response, ws } from "./ws";
import React, { useLayoutEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
// @ts-ignore
import useWebSocket, { JsonValue, ReadyState } from "react-use-websocket";
import { AppState, setRealTimeState, setWSStatus } from "@/store/features/app";
import StateDialog from "./StateDialog";
import { RootDispatch, RootState } from "@/store";
import StartServerDialog from "./StartServerDialog";
import { setArmModeState, setConnectState } from "@/store/features/arm";
import { ChartWorker } from "@/lib/worker";
import { setRoboticArmSystemInformation } from "@/store/features/ws";
import { switchObserveState } from "@/store/features/assistants";

let url = `127.0.0.1:18355`;
// 容错
if (import.meta.env.MODE !== "development") {
  url = `127.0.0.1:18355`;
}

// 假设这里有定义Props类型
// type Props = {
//   children: React.ReactNode;
// };

const worker = ChartWorker.getInstance();

const SocketState = React.memo(() => {
  const dispatch = useDispatch<RootDispatch>();
  const [status, setStatus] = useState("");
  const state = useSelector<RootState, AppState>((state) => state.app);

  // 连接ws
  const wsr = useWebSocket<Response<unknown>>(`ws://${url}/ws?type=websocket`, {
    shouldReconnect: () => true,
    reconnectInterval: 5000,
    reconnectAttempts: 99,
  });

  // 连接状态
  useLayoutEffect(() => {
    const connectionStatus = {
      [ReadyState.CONNECTING]: "Connecting",
      [ReadyState.OPEN]: "Open",
      [ReadyState.CLOSING]: "Closing",
      [ReadyState.CLOSED]: "Closed",
      [ReadyState.UNINSTANTIATED]: "Uninstantiated",
    }[wsr.readyState];

    setStatus(connectionStatus);

    dispatch(setWSStatus(connectionStatus === "Open"));
    // if (connectionStatus === "Closing") {
    //   toast.error("服务连接失败！", {
    //     position: "top-center",
    //   });
    // }

    if (connectionStatus === "Open") {
      ws.init(wsr);
      ws.onListenerLog((data) => {
        dispatch({
          type: "log/addLog",
          payload: { command: data.msg, color: data.color },
        });
      });
    }
  }, [wsr.readyState]);

  // 监听后端服务通信
  useLayoutEffect(() => {
    if (!wsr.lastJsonMessage) return;
    const { type, data, cmd } = wsr.lastJsonMessage;
    if (type === "report") {
      if (cmd === "devices_info_report") {
        // 机械臂系统信息
        dispatch(setRoboticArmSystemInformation(data));
      }

      if (cmd === "observe_over") {
        dispatch(switchObserveState());
        return;
      }
      if (cmd === "target_actual_status_report") {
        worker.postMessage({
          type: "message",
          value: data,
        });
        // const keys = Object.keys(data!);
        // // 目前只有一组数据时 判断为关节观测数据
        // if (keys.length === 1) {
        //   const jointsData = (data as any)[keys[0]] as number[];
        //   worker.postMessage({
        //     type: "message",
        //     value: {
        //       type: keys[0],
        //       data: jointsData,
        //     },
        //   });
        // }
        return;
      }
      dispatch(setArmModeState((data as { xarm_mode: number }).xarm_mode + ""));

      dispatch(
        setConnectState(
          (
            data as {
              xarm_connected: boolean;
              xarm_mode: number;
              xarm_state: number;
            }
          ).xarm_connected
        )
      );

      dispatch(setRealTimeState(data));
      return;
    }

    ws.onMessage(wsr.lastJsonMessage);
  }, [wsr.lastMessage]);

  return (
    <>
      {!state.server.server_status ? <StartServerDialog /> : null}
      {state.server.ws_status ? <StateDialog status={status} /> : null}
    </>
  );
});

export default SocketState;
