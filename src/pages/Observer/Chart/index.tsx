import React, {
  useMemo,
  Suspense,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Spin } from "antd";
import { listen } from "@tauri-apps/api/event";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { AssistantsState } from "@/store/features/assistants";
import { useOptions } from "../FilterCriteria/useOptions";
import { OPTION_EMPTY } from "@/lib/constant";
import { cn } from "@/lib/utils";
import {
  ChartJointValueMap,
  ObserveChartDate,
  ObserveTypeData,
  JointValueKey,
} from "../options";

const JointChart = React.lazy(() => import("./JointChart"));

const MAX_LENGTH = 6000;

export default () => {
  const state = useSelector<RootState, AssistantsState>(
    (state) => state.assistants
  );
  const { jointOrCoordinateOptions } = useOptions(state);

  const echartsRef = useRef<Record<number, any>>({});
  const chartDataRef = useRef<ObserveChartDate>({
    0: {},
    1: {},
    2: {},
    3: {},
    4: {},
    5: {},
    6: {},
  });
  const rafRef = useRef<number | null>(null);

  const currentType = useRef<JointValueKey>("target_joint_positions");

  // 获取某关节某类型数据
  const getSeries = useCallback(
    (jointIndex: number, type: JointValueKey): number[] => {
      // @ts-ignore
      return chartDataRef.current[jointIndex]?.[type] || [];
    },
    []
  );

  useEffect(() => {
    let unlisten = () => {};

    listen("robot-data", ({ payload }) => {
      const { data } = payload as Record<"data", ObserveTypeData[]>;
      if (!data?.length) return;

      data.forEach(({ type, value }) => {
        value.forEach((v, i) => {
          // @ts-ignore
          const jointData = chartDataRef.current[i];
          if (!jointData[type]) jointData[type] = [];
          jointData[type]!.push(v);
          if (jointData[type]!.length > MAX_LENGTH) jointData[type]!.shift();
        });
      });

      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          const type = currentType.current;
          Object.entries(echartsRef.current).forEach(([key, chart]) => {
            const jointIndex = Number(key);
            const data: ChartJointValueMap = {
              [type]: getSeries(jointIndex, type),
            };
            chart?.update(data);
          });
          rafRef.current = null;
        });
      }
    }).then((un) => (unlisten = un));

    return () => {
      unlisten();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [getSeries]);

  const charts = useMemo(() => {
    if (state.filter_field.joint_dir !== OPTION_EMPTY) {
      return new Array(1).fill({});
    }
    return new Array(jointOrCoordinateOptions.length - 1).fill({});
  }, [state.filter_field.joint_dir, jointOrCoordinateOptions]);

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
        {charts.map((_, index) => {
          const jointIndex =
            charts.length === 1 ? +state.filter_field.joint_dir : index;

          return (
            <JointChart
              index={jointIndex}
              key={`chart-${jointIndex}`}
              // @ts-ignore
              getChartData={() => {}}
              ref={(r: any) => {
                if (r) echartsRef.current[jointIndex] = r;
              }}
            />
          );
        })}
      </div>
    </Suspense>
  );
};
