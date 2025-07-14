import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { SHOW_RAD_TYPE } from "../options";
import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import { RootDispatch, RootState } from "@/store";
import {
  AssistantsState,
  downloadObserverFile,
  setSelectedField,
  switchObserveState,
} from "@/store/features/assistants";
import { useRequest } from "ahooks";
import { useOptions } from "./useOptions";
import { OPTION_EMPTY } from "@/lib/constant";
import { cn } from "@/lib/utils";
import SwitchButton from "@/pages/components/switch_button";

export default function FilterCriteria() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<RootDispatch>();
  const state = useSelector<RootState, AssistantsState>(
    (state) => state.assistants
  );

  // 表单选项
  const {
    jointOrCoordinateOptions,
    observeTypeOptions,
    frequencyOptions,
    unitOptions,
    analysisOrObserveOptions,
    compareOrDifferentialOptions,
  } = useOptions(state);

  // 设置表单
  async function setFormValue(value: Partial<typeof state.filter_field>) {
    if (value?.type || value?.type === "") {
      const op = value?.type === "" ? [] : value?.type.split(",");
      let type = "0";
      if (op.length > 1) {
        type = "3";
      } else if (op.length === 1) {
        type = op[0].toString();
      }
      value.type = type;
    }
    return dispatch(setSelectedField({ ...state.filter_field, ...value }));
  }

  // 解析checkbox默认值
  const observeCheck = useMemo(() => {
    const types: { [props: string]: boolean[] } = {
      "0": [false, false],
      "1": [true, false],
      "2": [false, true],
      "3": [true, true],
    };
    return types[state.filter_field.type] || [];
  }, [state.filter_field.type]);

  // checkbox 事件
  function onCheckedChange(t = 0, checked: boolean) {
    const type = [...observeCheck];
    type[t] = checked;

    let typeStr = "";
    if (type[0] && type[1]) {
      typeStr = "3";
    }
    if (type[0] && !type[1]) {
      typeStr = "1";
    }
    if (!type[0] && type[1]) {
      typeStr = "2";
    }
    if (!type[0] && !type[1]) {
      typeStr = "0";
    }
    setFormValue({ type: typeStr });
  }

  // 下载观测数据文件

  const { run: downloadFile, loading: downloadLoading } = useRequest(
    async () => {
      return dispatch(downloadObserverFile());
    },
    {
      manual: true,
      debounceMaxWait: 300,
      debounceLeading: true,
    }
  );

  const { run: onHandelObserver, loading: observerLoading } = useRequest(
    async () => {
      return dispatch(switchObserveState());
    },
    {
      manual: true,
      debounceMaxWait: 300,
      debounceLeading: true,
    }
  );

  // 禁用状态
  const disabledState = useMemo(() => {
    return state.reporting || !state.server_state;
  }, [state.reporting, state.server_state]);

  // observe_type title
  const jointTypeTitle = useMemo(() => {
    const { label } = observeTypeOptions.find((item) => {
      return item.value === state.filter_field.observe_type;
    }) ?? { label: "" };
    return label;
  }, [state.filter_field.observe_type, i18n.language]);

  return (
    <div className="flex justify-between">
      <div
        className={cn(
          "flex justify-start gap-5",
          i18n.language === "en-US" && " w-[60%] overflow-x-auto"
        )}
      >
        {/* 观测分析 */}
        <Select
          value={state.filter_field.mode}
          onValueChange={(value) => setFormValue({ mode: value })}
          disabled={disabledState}
        >
          <SelectTrigger className="w-fit bg-white">
            <SelectValue placeholder={state.filter_field.mode}></SelectValue>
          </SelectTrigger>
          <SelectContent>
            {analysisOrObserveOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {t(item.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 观测分析类型 */}
        <Select
          value={state.filter_field.observe_type}
          onValueChange={(value) =>
            setFormValue({ observe_type: value, joint_dir: OPTION_EMPTY })
          }
          disabled={disabledState}
        >
          <SelectTrigger
            className="w-fit max-w-[12rem] bg-white"
            title={jointTypeTitle}
          >
            <SelectValue
              className="text-start"
              placeholder={state.filter_field.observe_type}
            ></SelectValue>
          </SelectTrigger>
          <SelectContent>
            {observeTypeOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 关节或者坐标 */}
        <Select
          value={state.filter_field.joint_dir}
          onValueChange={(value) => setFormValue({ joint_dir: value })}
          disabled={disabledState}
        >
          <SelectTrigger className="w-fit max-w-[10rem] min-w-[7rem] bg-white">
            <SelectValue
              placeholder={state.filter_field.joint_dir}
            ></SelectValue>
          </SelectTrigger>
          <SelectContent>
            {jointOrCoordinateOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 频率 */}
        <Select
          value={state.filter_field.hz}
          onValueChange={(value) => setFormValue({ hz: value })}
          disabled={disabledState}
        >
          <SelectTrigger className="w-[7rem] bg-white">
            <SelectValue placeholder={state.filter_field.hz}></SelectValue>
          </SelectTrigger>
          <SelectContent>
            {frequencyOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 单位 */}
        {SHOW_RAD_TYPE.includes(state.filter_field.observe_type) ? (
          <Select
            value={state.filter_field.unit}
            onValueChange={(value) => setFormValue({ unit: value })}
            disabled={disabledState}
          >
            <SelectTrigger className="w-[7rem] bg-white">
              <SelectValue placeholder={state.filter_field.unit}></SelectValue>
            </SelectTrigger>
            <SelectContent>
              {unitOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <div
          className={cn(
            "flex gap-2 items-center text-default",
            disabledState ? "text-gray-400" : ""
          )}
        >
          <span className="break-keep text-nowrap">{t("sampleTime")}：</span>
          <Input
            disabled={disabledState}
            autoFocus={false}
            type="number"
            min={1}
            max={4000}
            value={state.filter_field.time}
            onChange={(e) => {
              setFormValue({ time: +e.target.value });
            }}
            className="w-[5.3rem] text-center bg-white"
          />
          <span>S</span>
        </div>

        {/* 观测分析类型 */}
        {state.filter_field.mode !== "observer" ? (
          <SwitchButton
            className="h-[3.11rem] w-fit rounded-md"
            disabled={!state.server_state}
            options={compareOrDifferentialOptions}
            active={state.filter_field.compare}
            onChange={(value) => setFormValue({ compare: value })}
          />
        ) : null}
      </div>
      <div className="flex justify-start gap-5 ">
        <div className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            id="observer"
            checked={observeCheck[0]}
            onCheckedChange={(v) => onCheckedChange(0, !!v)}
            disabled={disabledState}
          ></Checkbox>
          <Label htmlFor="observer" className="cursor-pointer">
            {t("observation")}
          </Label>
        </div>
        <div className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            id="planning"
            checked={observeCheck[1]}
            onCheckedChange={(v) => onCheckedChange(1, !!v)}
            disabled={disabledState}
          ></Checkbox>
          <Label htmlFor="planning" className="cursor-pointer">
            {t("recordCSV")}
          </Label>
        </div>

        {["2", "3"].includes(state.filter_field.type) &&
        state.show_download_btn ? (
          <Button
            onClick={downloadFile}
            loading={downloadLoading}
            disabled={!state.server_state}
          >
            {t("download")}
          </Button>
        ) : null}

        <Button
          className="min-w-[4.5rem] w-[6rem]"
          disabled={
            ["0", "2"].includes(state.filter_field.type) || !state.server_state
          }
          onClick={onHandelObserver}
          loading={observerLoading}
        >
          {t(`${state.reporting ? "end" : "start"}`)}
        </Button>
      </div>
    </div>
  );
}
