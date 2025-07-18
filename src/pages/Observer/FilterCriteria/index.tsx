import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import ObserverSwitch from "./ObserverSwitch";
import Download from "./Download";
import { SelectCompareField, SelectHzField, SelectJointDirField, SelectModelField, SelectObserveTypeField, SelectTimeoutField, SelectUnitField } from "./SelectField";

export default function FilterCriteria() {
  const { i18n } = useTranslation();

  return (
    <div className="flex justify-between">
      <div
        className={cn(
          "flex justify-start gap-5",
          i18n.language === "en-US" && " w-[60%] overflow-x-auto"
        )}
      >
        {/* 观测分析 */}
        <SelectModelField />

        {/* 观测分析类型 */}
        <SelectObserveTypeField />

        {/* 关节或者坐标 */}
        <SelectJointDirField />

        {/* 频率 */}
        <SelectHzField />

        {/* 单位 */}
        <SelectUnitField />

        {/* 采样时间 */}
        <SelectTimeoutField />

        {/* 观测分析类型 */}
        <SelectCompareField />
      </div>
      <div className="flex justify-start gap-5 ">
        <Download />
        <ObserverSwitch />
      </div>
    </div>
  );
}
