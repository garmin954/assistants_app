import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RootDispatch, RootState } from "@/store";
import { downloadObserverFile, setSelectedField } from "@/store/features/assistants";
import { useRequest } from "ahooks";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useDisabled } from "./SelectField";
import { useAppSelector } from "@/hooks/reduxHooks";


export default function Download() {
    const { t } = useTranslation();
    const dispatch = useDispatch<RootDispatch>()
    const observering = useSelector<RootState, boolean>(
        (state) => state.app.shared_state.observering
    )

    const arm_conn = useSelector<RootState, boolean>(
        (state) => state.app.shared_state.arm_conn
    )

    const { disabled } = useDisabled()

    const csv = useAppSelector((state) => state.assistants.filter_field.csv)
    const observer = useAppSelector((state) => state.assistants.filter_field.observer)

    // 下载按钮
    const [showDownload, setShowDownload] = useState<boolean>(false);
    useEffect(() => {
        if (observering) {
            setShowDownload(false)
        } else {
            setShowDownload(csv)
        }
        if (!arm_conn) {
            setShowDownload(false)
        }
    }, [observering, arm_conn])

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

    return (
        <>
            <div className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                    id="observer"
                    checked={observer}
                    onCheckedChange={(v) => dispatch(setSelectedField({ observer: !!v }))}
                    disabled={disabled}
                ></Checkbox>
                <Label htmlFor="observer" className="cursor-pointer">
                    {t("observation")}
                </Label>
            </div>
            <div className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                    id="planning"
                    checked={csv}
                    onCheckedChange={(v) => dispatch(setSelectedField({ csv: !!v }))}
                    disabled={disabled}
                ></Checkbox>
                <Label htmlFor="planning" className="cursor-pointer">
                    {t("recordCSV")}
                </Label>
            </div>
            {
                showDownload ? (
                    <Button
                        onClick={downloadFile}
                        loading={downloadLoading}
                        disabled={disabled}
                    >
                        {t("download")}
                    </Button>
                ) : null}
        </>
    )

}