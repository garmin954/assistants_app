import { useMemo } from "react";
import {
  ARM_JOINT_TYPE_UNIT,
  ARM_MODEL_JOINT,
  DefaultOptionType,
  optionsCorrespondingToParameters,
} from "../options";
import { useTranslation } from "react-i18next";
import { AssistantsState } from "@/store/features/assistants";
import { OPTION_EMPTY } from "@/lib/constant";

export function useOptions(state: AssistantsState) {
  const { t, i18n } = useTranslation();

  // 观测类型
  const observeTypeOptions: DefaultOptionType[] = useMemo<
    DefaultOptionType[]
  >(() => {
    return t(
      state.filter_field.mode === "observer"
        ? "jointVelocityItems"
        : "analysisItems",
      {
        returnObjects: true,
      }
    ) as DefaultOptionType[];
  }, [i18n.language, state.filter_field.mode, state.filter_field.observe_type]);

  // 频率
  const frequencyOptions: DefaultOptionType[] = useMemo<
    DefaultOptionType[]
  >(() => {
    return [
      {
        value: state.sixDof ? "hz200" : "hz250",
        label: state.sixDof ? "200HZ" : "250HZ",
      },
      { value: "hz5", label: "5HZ" },
    ];
  }, [i18n.language, state.sixDof]);

  // 关节或者坐标
  const jointOrCoordinateOptions: DefaultOptionType[] = useMemo<
    DefaultOptionType[]
  >(() => {
    let options = optionsCorrespondingToParameters(
      state.filter_field.observe_type as keyof typeof ARM_JOINT_TYPE_UNIT
    );
    // 目前大于6是关节
    if (options.length <= 6) {
      options = [
        { value: OPTION_EMPTY, label: t("allCoordinateAxes") },
        ...options,
      ];
    } else {
      options = [{ value: OPTION_EMPTY, label: t("allJoints") }, ...options];
      // @ts-ignore
      options = options.splice(
        0,
        ARM_MODEL_JOINT["lite6"] + 1 // wsState.xArmInfo.xarm_type.toLowerCase()
      );
    }

    return options as DefaultOptionType[];
  }, [i18n.language, state.filter_field.observe_type, state.filter_field.mode]);

  // 单位
  const unitOptions: DefaultOptionType[] = useMemo<DefaultOptionType[]>(() => {
    return [
      { value: "radian", label: t("radian") },
      { value: "degree", label: t("angle") },
    ];
  }, [i18n.language]);

  // 分析观测
  const analysisOrObserveOptions: DefaultOptionType[] = useMemo<
    DefaultOptionType[]
  >(() => {
    return [
      { value: "observer", label: t("observer") },
      { value: "analysis", label: t("analysis") },
    ];
  }, [i18n.language]);

  // 对比或者差值
  const compareOrDifferentialOptions: DefaultOptionType[] = useMemo<
    DefaultOptionType[]
  >(() => {
    return [
      { value: "1", label: t("compare") },
      { value: "0", label: t("differential") },
    ];
  }, [i18n.language]);

  return {
    jointOrCoordinateOptions,
    observeTypeOptions,
    frequencyOptions,
    unitOptions,
    analysisOrObserveOptions,
    compareOrDifferentialOptions,
  };
}
