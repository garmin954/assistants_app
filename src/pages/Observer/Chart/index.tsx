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
import { cn, deepClone, sleep, toAngle, toRadian } from "@/lib/utils";
import {
  ObserveChartDate,
  ObserveTypeData,
  JointValueKey,
  getObserveTypes,
  ARM_JOINT_TYPE_UNIT,
  optionsCorrespondingToParameters,
  JDS,
  SHOW_RAD_TYPE,
} from "../options";
import { useAsyncEffect } from "ahooks";
import { useTranslation } from "react-i18next";

const JointChart = React.lazy(() => import("./JointChart"));
const MAX_LENGTH = 6000;
const DEFAULT_DATA = {
  jd1: {},
  jd2: {},
  jd3: {},
  jd4: {},
  jd5: {},
  jd6: {},
  jd7: {},
}
const UPDATE_INTERVAL = 100; // 100ms更新一次

export default () => {
  console.log("Chart------------------");
  const { i18n } = useTranslation();
  const mode = useSelector<RootState, string>(
    (state) => state.assistants.filter_field.mode
  );
  const unit = useSelector<RootState, string>(
    (state) => state.assistants.filter_field.unit
  );
  const jointDir = useSelector<RootState, string>(
    (state) => state.assistants.filter_field.joint_dir
  );
  const compare = useSelector<RootState, string>(
    (state) => state.assistants.filter_field.compare
  );
  const observeType = useSelector<RootState, JointValueKey>(
    (state) => state.assistants.filter_field.observe_type as JointValueKey
  );
  const axis = useSelector<RootState, number>(
    (state) => state.app.shared_state.axis
  );
  const armConn = useSelector<RootState, boolean>(
    (state) => state.app.shared_state.arm_conn
  );
  const serverState = useSelector<RootState, boolean>(
    (state) => state.assistants.server_state

  );
  const observering = useSelector<RootState, boolean>(
    (state) => state.app.shared_state.observering
  );

  const lastUpdateRef = useRef(0);
  const echartsRef = useRef<Record<string, any>>({});
  const chartDataRef = useRef<ObserveChartDate>(deepClone(DEFAULT_DATA));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (observering || !armConn) {
      chartDataRef.current = deepClone(DEFAULT_DATA);
    }
  }, [observering, armConn, mode])

  useEffect(() => {
    chartDataRef.current = deepClone(DEFAULT_DATA);
  }, [mode])


  // 获取显示的关节方向
  const jointDirOpts = useMemo(() => {
    const opts = optionsCorrespondingToParameters(
      observeType as keyof typeof ARM_JOINT_TYPE_UNIT
    );
    if (!serverState) {
      return opts.slice(0, 6);
    }
    if (jointDir !== OPTION_EMPTY) {
      return opts.filter((v) => v.value === jointDir);
    }
    return opts.slice(0, axis > 6 ? 6 : axis);
  }, [jointDir, axis, serverState])


  // 获取某关节某类型数据
  const getJointSeries = useCallback(
    (
      jointIndex: JDS,
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
      return deepClone(data);
    },
    []
  );

  // 渲染图表
  const renderChart = useCallback((observeType: JointValueKey) => {
    const types = getObserveTypes(observeType);
    Object.entries(echartsRef.current).forEach(([key, chart]) => {
      const data = getJointSeries(key as JDS, types, observeType);
      chart?.update(data);
    });
  }, [axis, unit])

  // 根据unit 转换chartDataRef数据
  const convertChartDataRef = useCallback(() => {
    // 转换弧度角度相互转换
    Object.entries(chartDataRef.current).forEach(([key, otd]) => {
      Object.entries(otd).forEach(([type, values]) => {
        if (SHOW_RAD_TYPE.includes(type)) {
          (chartDataRef.current[key as keyof ObserveChartDate] as Record<string, number[]>)[type] = values.map((v) => {
            return unit === "radian" ? toRadian(v) : toAngle(v);
          });
        }
      })
    })
    renderChart(observeType)
  }, [unit])

  useEffect(() => {
    convertChartDataRef();
  }, [unit])

  useEffect(() => {
    let unlisten = () => { };
    // 获取关节实时数据
    listen("ROBOT_TCP_DATA", ({ payload }) => {
      const { data } = payload as Record<"data", ObserveTypeData[]>;
      if (!data?.length) return;

      // 设置数据
      data.forEach(({ type, value }) => {
        value.forEach((v, i) => {
          const jointData = chartDataRef.current[`jd${i + 1}` as JDS];
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
            renderChart(observeType)
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

  // 触发图表渲染
  useAsyncEffect(async () => {
    await sleep(100);
    renderChart(observeType)
  }, [observeType, jointDir, compare, armConn, i18n.language])

  const LoadingTmp = <Spin spinning={true} size="large" className="mt-[20%]" />;

  return (
    <Suspense fallback={LoadingTmp}>
      <div
        className={cn(
          "pt-[3.2rem] grid grid-cols-3 grid-rows-2 gap-x-[1.8rem] gap-y-[2rem] flex-1 overflow-hidden",
          jointDirOpts.length === 1 ? "grid-cols-1 grid-rows-1" : ""
        )}
      >
        {jointDirOpts.map((opt) => {
          return (
            <JointChart
              index={opt.value}
              key={`chart-${opt.value}`}
              ref={(r: any) => {
                if (r) echartsRef.current[opt.value] = r;
              }}
            />
          );
        })}
      </div>
    </Suspense>
  );
};
