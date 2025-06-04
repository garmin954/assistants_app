import React, {
  useMemo,
  Suspense,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Spin } from "antd";

const JointChart = React.lazy(() => import("./JointChart"));
import { useTranslation } from "react-i18next";

import { useSelector } from "react-redux";
import { ChartWorker } from "@/lib/worker";
import { WsState } from "@/store/features/ws";
import { RootState } from "@/store";
import { ARM_MODEL_JOINT, ChartJointValueMap } from "../options";
import { AssistantsState } from "@/store/features/assistants";
import { useOptions } from "../FilterCriteria/useOptions";
import { OPTION_EMPTY } from "@/lib/constant";
import { cn } from "@/lib/utils";

const worker = ChartWorker.getInstance();

interface Props {
  active: string;
  type: string;
  useRad: boolean;
}

export default React.memo((props:Props) => {
  const { t: _t,  } = useTranslation();
  const wsState = useSelector<RootState, WsState>((state) => state.ws);
  const state = useSelector<RootState, AssistantsState>(
    (state) => state.assistants
  );

  const { jointOrCoordinateOptions } = useOptions(state);

  const echartsRef = useRef<{
    [key: string]: any;
  }>({});

  
  // 监听worker推送的关节数据
  useEffect(() => {
    worker.onmessage = (event: MessageEvent) => {
      const { type, value, label } = event.data;
      if (type === "joints") {
        value.forEach((item: ChartJointValueMap, index: number) => {
          echartsRef.current[index]?.update(item, label);
        });
      }
    };
  }, []);


  // 设置关节模型
  useEffect(() => {
    if (wsState.xArmInfo.xarm_type) {
      worker.postMessage({
        type: "set_joint_model",
        value:
          ARM_MODEL_JOINT[
            wsState.xArmInfo.xarm_type as keyof typeof ARM_MODEL_JOINT
          ] || 6,
      });  
    }
    
  }, [wsState.xArmInfo.xarm_type]);

   const getChartData = useCallback(() =>{
    worker.postMessage({ type: "post_chart_data", value: null });
  },[])

 
  // 生成图表数量
  const charts = useMemo(() => {
    if (state.filter_field.joint !== OPTION_EMPTY) {
      return new Array(1).fill({});
    }
    const cap = jointOrCoordinateOptions.length - 1;
    return new Array(cap).fill({});
  }, [state.filter_field.joint, jointOrCoordinateOptions]);

  const LoadingTmp = <Spin spinning={true} size="large" className="mt-[20%]" />;
  return (
    <Suspense fallback={LoadingTmp}>
      <div
        className={cn(
          "pt-[3.2rem] grid grid-cols-3 grid-rows-2 gap-x-[1.8rem] gap-y-[2rem] flex-1 overflow-hidden",
          charts.length === 1 ? "grid-cols-1 grid-rows-1" : ""
        )}
        id="joint_chart_box"
      >
        {charts.map((_, index) => (
          <JointChart
            index={charts.length === 1 ? +state.filter_field.joint : index}
            key={`chart-${index}`}
            getChartData={getChartData}
            ref={(r: any) =>
              (echartsRef.current[
                charts.length === 1 ? +state.filter_field.joint : index
              ] = r!)
            }
            {...props}
          />
        ))}
      </div>
    </Suspense>
  );
});
