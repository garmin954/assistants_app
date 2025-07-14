import { RootDispatch } from "@/store";
import { checkUpdater, downloadApp, openUpdateDialog } from "@/store/features/updater";
import { UPDATER_STEP } from "@/lib/constant";
import { useDispatch } from "react-redux";
import { useCallback } from "react";

export default function useUpdater() {
    const dispatch = useDispatch<RootDispatch>();

    const isBeta = false
    const onCheckUpdater = useCallback(() => {
        dispatch((_, getState) => {
            const currentStep = getState().updater.step; // 动态获取最新 step
            switch (currentStep) {
                case UPDATER_STEP.NORMAL:
                case UPDATER_STEP.CHECK:
                    return dispatch(checkUpdater(isBeta)).then(({ payload }: any) => {
                        if (payload.code === 0 && !payload.data?.is_latest) {
                            dispatch(openUpdateDialog(true));
                        }
                    });
                case UPDATER_STEP.DOWNLOAD:
                    return dispatch(openUpdateDialog(true));
                default:
                    return;
            }
        });
    }, [dispatch]);

    const onCloseUpdaterDialog = useCallback(() => {
        dispatch(openUpdateDialog(false));
    }, [dispatch]);

    const onDownloadApp = useCallback(() => {
        // 下载安装
        dispatch(downloadApp())
    }, [dispatch])


    return { onCheckUpdater, onCloseUpdaterDialog, onDownloadApp };
}