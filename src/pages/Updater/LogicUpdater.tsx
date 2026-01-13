import { UPDATER_STEP } from "@/lib/constant";
import { RootDispatch } from "@/store";
import {
  checkUpdater,
  downloadApp,
  closeDownloadDialog,
} from "@/store/features/updater";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import ReleaseDescDialog from "./ReleaseDescDialog";
import DownloadProgress from "./DownloadProgress";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { useAppSelector } from "@/hooks/reduxHooks";
import { useWhyDidYouUpdate } from "ahooks";

interface Props {
  className?: string;
  isBeta?: boolean;
}
export default function LogicUpdater(props: Props) {
  const { i18n, t } = useTranslation("updater");
  const { isBeta = false } = props;
  const step = useAppSelector((state) => state.updater.step);
  const updater = useAppSelector((state) => state.updater.updater);
  const isLoading = useAppSelector((state) => state.updater.isLoading);

  const dispatch = useDispatch<RootDispatch>();
  const [showDesc, setShowDesc] = useState(false);

  const onUpdate = useCallback(async () => {
    console.log('onUpdate===>');
    switch (step) {
      case UPDATER_STEP.NORMAL:
      case UPDATER_STEP.CHECK:
        dispatch(closeDownloadDialog())
        dispatch(checkUpdater(isBeta)).then(({ payload }) => {
          // 有新版本 弹出更新信息
          if (payload.code === 0 && !payload.data?.is_latest) {
            // setShowDesc(true);
          }
        });
        break;
      case UPDATER_STEP.DOWNLOAD:
        setShowDesc(true);
        break;
      default:
        break;
    }
  }, [step, isBeta, dispatch]);

  useEffect(() => {
    // 仅在组件挂载时执行一次检查，模拟 componentDidMount
    const initCheck = async () => {
      // 这里如果直接调用 onUpdate，它会闭包当时 step 的状态
      // 由于这里只是为了初始化检查，通常 step 初始就是 CHECK/NORMAL
      // 如果需要复用逻辑，可以手动 dispatch checkUpdater
      dispatch(checkUpdater(isBeta));
    }
    initCheck();
  }, []); // 保持空依赖数组，只在挂载时检查


  const handleInstall = useCallback(() => {
    setShowDesc(false)
    dispatch(downloadApp())
  }, [dispatch]);

  const handleClose = useCallback(() => {
    setShowDesc(false)
  }, []);

  useWhyDidYouUpdate("LogicUpdater", {
    step,
    updater,
    isLoading,
    dispatch,
    showDesc,
    setShowDesc,
    onUpdate,
    handleInstall,
  })

  return (
    <>
      {
        step === UPDATER_STEP.DOWNLOAD || step === UPDATER_STEP.INSTALL ? (
          <Button
            className={clsx("min-w-[8rem] relative")}
            onClick={onUpdate}
            loading={isLoading}
            variant="outline"
          >
            <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-green-500 "></div>
            {step === UPDATER_STEP.DOWNLOAD && t("new_version_v", { version: updater.version })}
            {step === UPDATER_STEP.INSTALL && t("install_now")}
          </Button>
        ) : null
      }


      <ReleaseDescDialog
        show={showDesc}
        onInstall={handleInstall}
        onClose={handleClose}
        content={i18n.language === "cn" ? updater.body.content.cn : updater.body.content.en}
        version={updater.version}
      />

      <DownloadProgress />
    </>
  );
}
