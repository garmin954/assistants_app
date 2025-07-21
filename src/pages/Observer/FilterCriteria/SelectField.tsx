import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import SwitchButton from "@/pages/components/switch_button";
import { RootDispatch, RootState } from "@/store";
import { SELECTED_FIELD, setSelectedField } from "@/store/features/assistants";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { ARM_JOINT_TYPE_UNIT, ARM_MODEL_JOINT, DefaultOptionType, optionsCorrespondingToParameters, SHOW_RAD_TYPE } from "../options";
import { OPTION_EMPTY } from "@/lib/constant";


type Props = {
    field: keyof typeof SELECTED_FIELD,
    isInput?: boolean,
    isSwitchBtn?: boolean,
    disabled: boolean,
    opts: {
        value: string,
        label: string,
    }[]
}
export default function SelectField(props: Props) {
    const { t } = useTranslation();
    const dispatch = useDispatch<RootDispatch>();
    const value = useSelector((state: RootState) => state.assistants.filter_field[props.field] as string);

    if (props.isSwitchBtn) {
        return (
            <SwitchButton
                className="h-[3.11rem] w-fit rounded-md"
                disabled={props.disabled}
                options={props.opts}
                active={value}
                onChange={async (value) => await dispatch(setSelectedField({ [props.field]: value }))}
            />
        )
    }

    if (props.isInput) {
        return (
            <div
                className={cn(
                    "flex gap-2 items-center text-default",
                    props.disabled ? "text-gray-400" : "text-text"
                )}
            >
                <span className="break-keep text-nowrap">{t("sampleTime")}：</span>
                <Input
                    disabled={props.disabled}
                    autoFocus={false}
                    type="number"
                    min={1}
                    max={4000}
                    value={value}
                    onChange={(value) => dispatch(setSelectedField({ [props.field]: +value.target.value }))}
                    className="w-[5.3rem] text-center bg-white"
                />
                <span>S</span>
            </div>
        )
    }
    return (
        <Select
            value={value}
            onValueChange={(value) => dispatch(setSelectedField({ [props.field]: value }))}
            disabled={props.disabled}
        >
            <SelectTrigger className="w-fit bg-white">
                <SelectValue placeholder={value}></SelectValue>
            </SelectTrigger>
            <SelectContent>
                {props.opts.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                        {t(item.label)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

export function useDisabled() {
    const observering = useSelector((state: RootState) => state.app.shared_state.observering);
    const serverState = useSelector((state: RootState) => state.assistants.server_state);

    const disabled = useMemo(() => {
        return observering || !serverState;
    }, [observering, serverState]);

    return { disabled, observering, serverState };
}

// 分析观测
export function SelectModelField() {
    const { t, i18n } = useTranslation();
    const { disabled } = useDisabled()
    // 分析观测
    const opts: DefaultOptionType[] = useMemo<
        DefaultOptionType[]
    >(() => {
        return [
            { value: "observer", label: t("observe") },
            { value: "analysis", label: t("analysis") },
        ];
    }, [i18n.language]);

    return (
        <SelectField
            field="mode"
            disabled={disabled}
            opts={opts}
        />
    )
}

// 观测分析类型
export function SelectObserveTypeField() {
    const { t, i18n } = useTranslation();
    const { disabled } = useDisabled()
    const mode = useSelector((state: RootState) => state.assistants.filter_field.mode);
    // 观测类型
    const opts: DefaultOptionType[] = useMemo<
        DefaultOptionType[]
    >(() => {
        return t(
            mode === "observer"
                ? "jointVelocityItems"
                : "analysisItems",
            {
                returnObjects: true,
            }
        ) as DefaultOptionType[];
    }, [i18n.language, mode]);


    return (
        <SelectField
            field="observe_type"
            disabled={disabled}
            opts={opts}
        />
    )
}

// 关节或者坐标
export function SelectJointDirField() {
    const { t, i18n } = useTranslation();
    const { disabled } = useDisabled()
    const observe_type = useSelector((state: RootState) => state.assistants.filter_field.observe_type);
    const mode = useSelector((state: RootState) => state.assistants.filter_field.mode);
    const axis = useSelector((state: RootState) => state.app.shared_state.axis);
    // 关节或者坐标
    const opts: DefaultOptionType[] = useMemo<
        DefaultOptionType[]
    >(() => {
        let options = optionsCorrespondingToParameters(
            observe_type as keyof typeof ARM_JOINT_TYPE_UNIT
        );
        // 目前大于6是关节
        if (options.length <= 6) {
            options = [
                { value: OPTION_EMPTY, label: t("allCoordinateAxes") },
                ...options,
            ];
        } else {
            options = [{ value: OPTION_EMPTY, label: t("allJoints") }, ...options].slice(0, axis + 1);
        }

        return options as DefaultOptionType[];
    }, [i18n.language, observe_type, mode, axis]);


    return (
        <SelectField
            field="joint_dir"
            disabled={disabled}
            opts={opts}
        />
    )
}

// 频率
export function SelectHzField() {
    const { i18n } = useTranslation();
    const { disabled } = useDisabled()
    const ftSensor = useSelector<RootState, boolean>((state) => state.app.shared_state.ft_sensor);
    // 频率
    const opts: DefaultOptionType[] = useMemo<
        DefaultOptionType[]
    >(() => {
        return [
            {
                value: ftSensor ? "hz200" : "hz250",
                label: ftSensor ? "200HZ" : "250HZ",
            },
            { value: "hz5", label: "5HZ" },
        ];
    }, [i18n.language, ftSensor]);

    return (
        <SelectField
            field="hz"
            disabled={disabled}
            opts={opts}
        />
    )
}

// 单位
export function SelectUnitField() {
    const { t, i18n } = useTranslation();
    const { disabled } = useDisabled()
    const observe_type = useSelector((state: RootState) => state.assistants.filter_field.observe_type);

    // 单位
    const opts: DefaultOptionType[] = useMemo<DefaultOptionType[]>(() => {
        return [
            { value: "radian", label: t("radian") },
            { value: "angle", label: t("angle") },
        ];
    }, [i18n.language]);

    if (!SHOW_RAD_TYPE.includes(observe_type)) {
        return null
    }

    return (
        <SelectField
            field="unit"
            disabled={disabled}
            opts={opts}
        />
    )
}

// 采样时间
export function SelectTimeoutField() {
    const { disabled } = useDisabled()

    return (
        <SelectField
            field="timeout"
            disabled={disabled}
            isInput
            opts={[]}
        />
    )
}

// 对比或者差值
export function SelectCompareField() {
    const { t, i18n } = useTranslation();
    const { serverState } = useDisabled()
    const mode = useSelector((state: RootState) => state.assistants.filter_field.mode);

    // 单位
    const opts: DefaultOptionType[] = useMemo<
        DefaultOptionType[]
    >(() => {
        return [
            { value: "1", label: t("compare") },
            { value: "0", label: t("differential") },
        ];
    }, [i18n.language]);

    if (mode === "observer") {
        return null
    }

    return (
        <SelectField
            field="compare"
            disabled={!serverState}
            isSwitchBtn
            opts={opts}
        />
    )
}
