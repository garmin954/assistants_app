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
import { OPTION_EMPTY } from "@/lib/constant";
import { cn, deepClone } from "@/lib/utils";
import {
  ObserveChartDate,
  ObserveTypeData,
  JointValueKey,
  getObserveTypes,
} from "../options";

const JointChart = React.lazy(() => import("./JointChart"));
const MAX_LENGTH = 6000;
const DEFAULT_DATA = {
  0: {},
  1: {},
  2: {},
  3: {},
  4: {},
  5: {},
  6: {},
}
const UPDATE_INTERVAL = 100; // 100ms更新一次

export default () => {
  console.log("Chart------------------");

  const jointDir = useSelector<RootState, string>(
    (state) => state.assistants.filter_field.joint_dir
  );
  const observeType = useSelector<RootState, JointValueKey>(
    (state) => state.assistants.filter_field.observe_type as JointValueKey
  );
  const axis = useSelector<RootState, number>(
    (state) => state.app.shared_state.axis
  );

  const observering = useSelector<RootState, boolean>(
    (state) => state.app.shared_state.observering
  );
  const lastUpdateRef = useRef(0);
  const echartsRef = useRef<Record<number, any>>({});
  const chartDataRef = useRef<ObserveChartDate>(deepClone(DEFAULT_DATA));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (observering) {
      chartDataRef.current = deepClone(DEFAULT_DATA);
    }
  }, [observering])

  // 获取某关节某类型数据
  const getJointSeries = useCallback(
    (
      jointIndex: number,
      type: JointValueKey[],
      observeType: JointValueKey
    ): Record<JointValueKey, number[]> => {
      const data: Record<JointValueKey, number[]> = {} as Record<JointValueKey, number[]>;
      if (observeType.startsWith("analysis")) {
        type.push('difference_data');
      }
      type.forEach((t) => {
        data[t] = [...(chartDataRef.current[jointIndex as keyof ObserveChartDate]?.[t] || [])]
      })
      return data;
    },
    []
  );

  useEffect(() => {
    let unlisten = () => { };
    // 获取关节实时数据
    listen("ROBOT_TCP_DATA", ({ payload }) => {
      const { data } = payload as Record<"data", ObserveTypeData[]>;
      if (!data?.length) return;

      // 设置数据
      data.forEach(({ type, value }) => {
        value.forEach((v, i) => {
          const jointData = chartDataRef.current[i as keyof ObserveChartDate];
          if (!(type in jointData)) jointData[type] = [];
          jointData[type]!.push(v);
          if (jointData[type]!.length > MAX_LENGTH) jointData[type]!.shift();
        });
      });

      // 更新图表数据
      if (rafRef.current === null) {
        const now = Date.now();
        if (now - lastUpdateRef.current > UPDATE_INTERVAL) {
          rafRef.current = requestAnimationFrame(() => {
            const types = getObserveTypes(observeType);
            Object.entries(echartsRef.current).forEach(([key, chart]) => {
              chart?.update(getJointSeries(Number(key), types, observeType));
            });
            lastUpdateRef.current = now;
            rafRef.current = null;
          });
        }
      }
    }).then((un) => (unlisten = un));

    return () => {
      unlisten();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [getJointSeries, observeType]);

  const charts = useMemo(() => {
    if (jointDir !== OPTION_EMPTY) {
      return new Array(1).fill({});
    }
    return new Array(axis < 7 ? axis : 6).fill({});
  }, [jointDir, axis]);

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
            charts.length === 1 ? +jointDir : index;

          return (
            <JointChart
              index={jointIndex}
              key={`chart-${jointIndex}`}
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
