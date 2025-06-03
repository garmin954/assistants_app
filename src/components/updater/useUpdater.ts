import { RootDispatch, RootState } from "@/store";
import { checkUpdater, downloadApp, openUpdateDialog, UpdaterState } from "@/store/features/updater";
import { UPDATER_STEP } from "@/lib/constant";
import { useDispatch, useSelector } from "react-redux";

export default function useUpdater() {
    const state = useSelector<RootState, UpdaterState>(state => state.updater);
    const dispatch = useDispatch<RootDispatch>();

    let isBeta = false
    async function onCheckUpdater() {
        switch (state.step) {
            case UPDATER_STEP.NORMAL:
            case UPDATER_STEP.CHECK:
                dispatch(checkUpdater(isBeta)).then(({ payload }) => {
                    // 有新版本 弹出更新信息
                    if (payload.code === 0 && !payload.data?.is_latest) {
                        dispatch(openUpdateDialog(true));
                    }
                });
                break;
            case UPDATER_STEP.DOWNLOAD:
                dispatch(openUpdateDialog(true));
                break;
            default:
                break;
        }
    }

    function onCloseUpdaterDialog() {
        dispatch(openUpdateDialog(false));
    }
    async function onDownloadApp() {
        // 下载安装
        dispatch(downloadApp())
    }
    return { onCheckUpdater, onCloseUpdaterDialog, state, onDownloadApp };
}