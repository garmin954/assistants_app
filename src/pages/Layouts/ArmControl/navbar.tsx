import { ARM_STATE_MAP } from "@/lib/constant";
import { RootState } from "@/store";
import { AppState } from "@/store/features/app";
import { ArmState } from "@/store/features/arm";
import { useMemo } from "react";
import { useSelector } from "react-redux";

export default function Navbar() {
  const state = useSelector<RootState, AppState>((state) => state.app);
  const arm = useSelector<RootState, ArmState>((state) => state.arm);

  const State = useMemo(() => {
    if (!state.realTime.xarm_connected) {
      return (
        <div className="text-[1.2rem]">
          <span>状态：</span>
          <span>未连接</span>
        </div>
      );
    }
    const { txt, color } =
      ARM_STATE_MAP[state.realTime.xarm_state as keyof typeof ARM_STATE_MAP];
    return (
      <div className="text-[1.2rem]">
        <span>状态：</span>
        <span style={{ color }}>{txt}</span>
      </div>
    );
  }, [state.realTime.xarm_state, state.realTime.xarm_connected]);
  return (
    <div className="text-[1.2rem] text-white flex gap-[2rem]">
      {State}
      <div className="">型号：{arm.info.xarm_type}</div>
      <div className="">机械臂SN：{arm.info.robot_sn}</div>
    </div>
  );
}
