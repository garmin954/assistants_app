import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  useImperativeHandle,
} from "react";
import { useSize } from "ahooks";

import * as echarts from "echarts/core";
import {
  GridComponent,
  DataZoomInsideComponent,
  TooltipComponent,
  LegendComponent , 
  GraphicComponent,
  MarkPointComponent 
} from "echarts/components";
import { LineChart } from "echarts/charts";
import { UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
import {
  ARM_JOINT_TYPE_UNIT,
  ChartJointValueMap,
  DefaultOptionType,
  JointValueKey,
  optionsCorrespondingToParameters,
} from "../options";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { AssistantsState } from "@/store/features/assistants";
import { CHARTS_OPTIONS, setChartSeries } from "./config";
import { deepClone } from "@/lib/utils";
import { useTranslation } from "react-i18next";

echarts.use([
  GridComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition,
  DataZoomInsideComponent,
  TooltipComponent,
  LegendComponent,
  GraphicComponent,
  MarkPointComponent 
]);

interface Props {
  index: number;
  getChartData: () => void;
}

type RefType = {
  update: (data: ChartJointValueMap, label: number[]) => void;
};

export default React.forwardRef<RefType, Props>((props, ref) => {
  const {t, i18n} = useTranslation();
  const enlargeRef = useRef(null);
  const state = useSelector<RootState, AssistantsState>(
    (state) => state.assistants
  );

  // 图表实例
  const chart = useRef<echarts.ECharts>();
  // 当前值
  const [curVal, setCurVal] = useState<string | null>("0");
  // 图表
  const echartsRef = useRef<HTMLDivElement>(null);
  // 初始化图表
  useEffect(() => {
    if (echartsRef.current) {
      chart.current = echarts.init(echartsRef.current,null, {
        renderer: 'canvas',
        useDirtyRect: false
      });
      // 确认图表实例是否正确初始化
      // console.log('chart.current initialized:', chart.current); 
      setCharts(true);
      if (chart.current) {
        chart.current.on("click", openSeriesDot);
        // 注册缩放和拖拽事件
        chart.current.on('dataZoom', updateMarkPoints);
      }
    }
    return () => {
      if (chart.current) {
        chart.current.off("click", openSeriesDot);
        chart.current.off('dataZoom', updateMarkPoints);
        chart.current.dispose();  
      }
    };
  }, [echartsRef.current]);
  const selectedPoints = useRef<{ key:string, value: string; name: string, coord:string[] }[][]>([[],[]]);
  function openSeriesDot(params:  echarts.ECElementEvent) {
    const index: 0|1 = params.seriesIndex as 0|1 ?? 0;
    const key = `${params.seriesIndex}-${params.name}`;
    console.log('params==>', params);
    if (params.componentType === 'series' || params.componentType === 'markPoint') {
      const pos = selectedPoints.current[index].findIndex(p => p.key === key);
      console.log('selectedPoints.current==>', selectedPoints.current, key, pos);
      // 如果已选中，则取消选择
      if (pos > -1) {
        selectedPoints.current[index].splice(pos, 1);
      }
      // 否则添加到选中列表
      else {
        selectedPoints.current[index].push({
          key,
          name: params.name,
          value: params.value as string,
          coord: [params.name, params.value+""] // 存储坐标信息
        });
      }

      // 更新markPoint数据
      updateMarkPoints();
    }
  }

   // 更新点位标记
   function updateMarkPoints() {
    const config:any[] = [];
    selectedPoints.current.forEach((item, index)=>{
      const markPointData = item.map(point => ({
        name: point.name,
        coord: point.coord,
        value: point.value,
        symbol: "circle",
        symbolSize: 10,
        animation: false,
        label: {
          show: true,
          position: 'insideLeft',
          backgroundColor: 'rgba(255,255,255,0.9)',
          color: '#333',
          borderColor: '#ccc',
          borderWidth: 1,
          borderRadius: 4,
          padding: [8, 12],
          formatter: `{b},{c}`,
          distance: 10, // 与点的距离
          shadowBlur: 10,
          shadowColor: 'rgba(0,0,0,0.1)'
        }
      }));
      config[index] = {
        markPoint: {
          data: markPointData
        }
      }
    })
      // 更新图表
      chart.current?.setOption({
        series: config
      });
  }
  // 缩放
  const size = useSize(enlargeRef);
  useEffect(() => {
    chart.current && setCharts();
  }, [size]);

  // 设置chart数据配置
  function setCharts(set = false) {
    if (set) {
      chart.current?.setOption(CHARTS_OPTIONS);
      setCurVal("0");
      props.getChartData();
    }
    chart.current?.resize();
  }

  const chartNameData = useMemo(() => {
    const data: Partial<Record<JointValueKey, string>> = {"response_subtract_data": t("response_subtract_data")};
    (t("jointVelocityItems",{returnObjects: true}) as DefaultOptionType[]).forEach((v) => {
      data[v.value as JointValueKey] = v.label;
    });

    return data;
  }, [i18n.language])

  // 更新数据
  function updateChartData(data: ChartJointValueMap, label: number[]) {
    const options = deepClone(CHARTS_OPTIONS);
    // options.series[0].symbol = "none";
    if (state.filter_field.jointType === "xarm_joint_temperatures") {
      // options.series[0].symbol = "emptyCircle";
      // options.xAxis.axisLabel.formatter = (value) => {
      //   return value.slice(11, value.length);
      // };
    }
    options.xAxis.data = label;
    // options.xAxis.axisLabel.interval = Math.ceil(label.length / 6);
    options.series = [];
    let index = 0;
    const val:string[] = [];
    (Object.keys(data) as JointValueKey[]).forEach((key) => {
      if (
        (state.filter_field.compare === "1" &&
          key !== "response_subtract_data") ||
        (state.filter_field.compare === "0" &&
          key === "response_subtract_data") ||
        state.filter_field.mode === "observe"
      ) {
        const d = data[key]!;
        (options.series as any[]).push(setChartSeries(d, chartNameData[key]));
        index++
        if (d[d.length - 1] !== undefined) {
          val.push(d[d.length - 1].toString());
        }
      }
    });
    setCurVal(val.join("/"));      
    chart.current?.setOption(options, {
      // replaceMerge: ['xAxis', 'series'],
      notMerge: true, // 不合并配置
      lazyUpdate: true, // 延迟更新
    });
  }

  // 标题
  const title = useMemo(() => {
    const option = optionsCorrespondingToParameters(
      state.filter_field.jointType as keyof typeof ARM_JOINT_TYPE_UNIT
    );
    const item = option.find((v) => +v.value === +props.index);
    return item?.label || null;
  }, [props.index, state.filter_field.jointType]);

  // 单位
  const unitTxt = useMemo(() => {
    let u =
      ARM_JOINT_TYPE_UNIT[
        state.filter_field.jointType as keyof typeof ARM_JOINT_TYPE_UNIT
      ][props.index];
    if (+state.filter_field.unit === 0 && u.includes("rad")) {
      u = u.replace("rad", "°");
    }
    return u;
  }, [props.index, state.filter_field.jointType, state.filter_field.unit]);

  useEffect(() => {
    selectedPoints.current = [[],[]];
  }, [state.filter_field.jointType, state.filter_field.compare, state.filter_field.mode, state.filter_field.unit]);

  useImperativeHandle(ref, () => ({ update: updateChartData }));
  return (
    <div
      ref={enlargeRef}
      className="bg-card rounded-lg shadow-sm px-6 pt-6 pb-12"
    >
      <div className="chart-unit  uf-font-medium flex justify-between">
        <div className="ml-0 text-lg">{title}</div>
        <div className="right">{(curVal || 0) + " " + unitTxt}</div>
      </div>
      <div style={{ height: "100%", width: "100%" }} ref={echartsRef}></div>
    </div>
  );
});
