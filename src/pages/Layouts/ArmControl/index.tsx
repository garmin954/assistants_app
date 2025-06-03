import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounceFn } from "ahooks";
import clsx from "clsx";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { RootDispatch, RootState } from "@/store";
import {
  ArmState,
  setArmMode,
  setArmStateApis,
  switchConnectArm,
} from "@/store/features/arm";
import { useLayoutEffect } from "react";
import { setTitleBar } from "@/store/features/app";
import Navbar from "./navbar";
import SwitchButton from "@/pages/components/switch_button";

export default function ArmControl() {
  const state = useSelector<RootState, ArmState>((state) => state.arm);
  const dispatch = useDispatch<RootDispatch>();

  useLayoutEffect(() => {
    setTimeout(() => {
      dispatch(
        setTitleBar({
          visible: true,
          title: "",
          extensions: <Navbar />,
        })
      );
    }, 0);
  }, []);

  const { run: handleArmStateApi } = useDebounceFn(
    (cmd) => {
      dispatch(
        setArmStateApis({
          cmd,
        })
      );
    },
    { wait: 200 }
  );

  /**
   * 连接/断开机械臂
   * force_disconnect: 强制断开
   */
  const { run: onSwitchArmConnect } = useDebounceFn(
    (force_disconnect = false) => {
      if (
        !/^(25[0-5]|2[0-4]\d|[0-1]\d{2}|[1-9]?\d)$/.test(state.ip.split(".")[3])
      ) {
        toast.warning("IP地址不合法", { position: "top-center" });
        return false;
      }
      dispatch(switchConnectArm({ force_disconnect }));
    },
    { wait: 500, leading: true }
  );

  const options = [
    { value: "2", label: "示教" },
    { value: "0", label: "位置" },
  ];

  return (
    <div className="grid gap-x-[1rem] gap-y-[1.42rem] grid-cols-4 grid-rows-2 bg-card shadow-sm rounded-xl p-[1.5rem] ">
      <div className="flex col-span-2 items-center">
        <Input
          placeholder="请输入IP地址"
          className="h-[3.5rem] rounded-l-md rounded-r-none col-span-2 text-center"
          value={state.ip}
          type="url"
          onChange={(e) =>
            dispatch({
              type: "arm/setArmIp",
              payload: e.target.value,
            })
          }
          disabled={state.connected}
        />
        <Button
          className={clsx(
            "h-[3.5rem] rounded-r-md rounded-l-none border-l-0 w-[5.5rem]"
          )}
          variant={state.connected ? "default" : "secondary"}
          onClick={() => onSwitchArmConnect()}
          loading={state.loading}
        >
          {state.connected ? "断开" : "连接"}
        </Button>
      </div>
      {state.stateApis &&
        Object.keys(state.stateApis).map((key) => {
          const btnOpt = state.stateApis[key as keyof typeof state.stateApis];
          const { loading, label, className } = btnOpt;

          if (key === "arm_mode") {
            return (
              <SwitchButton
                className="h-[3.25rem] w-full rounded-md"
                disabled={!state.connected}
                key={key}
                options={options}
                active={state.stateApis.arm_mode.active}
                onChange={(value) => dispatch(setArmMode(value))}
              />
            );
          }
          return (
            <Button
              key={key}
              className={clsx("h-[3.5rem] w-full rounded-md", className)}
              variant="outline"
              disabled={!state.connected || loading}
              loading={loading}
              onClick={() => handleArmStateApi(key)}
            >
              {label}
            </Button>
          );
        })}
    </div>
  );
}
