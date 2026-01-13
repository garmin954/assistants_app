import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { UPDATER_STEP } from "@/lib/constant";
import { formatBytes, formatSpeed } from "@/lib/utils";
import { RootDispatch } from "@/store";
import { installApp, toggleMinimizeDialog } from "@/store/features/updater";
import { useThrottleEffect } from "ahooks";
import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/hooks/reduxHooks";
import { Maximize2, Minimize2 } from "lucide-react";

export default function DownloadProgress() {
  const showDialog = useAppSelector(state => state.updater.download.showDialog);
  const isMinimized = useAppSelector(state => state.updater.download.isMinimized);
  const totalSize = useAppSelector(state => state.updater.download.totalSize);
  const downloaded = useAppSelector(state => state.updater.download.downloaded);
  const startTime = useAppSelector(state => state.updater.download.startTime);
  const progress = useAppSelector(state => state.updater.download.progress);
  const step = useAppSelector(state => state.updater.step);

  const dispatch = useDispatch<RootDispatch>();
  const { t } = useTranslation("updater");

  // 安装包大小
  const total = useMemo(() => {
    return formatBytes(totalSize);
  }, [totalSize]);

  // 已下载大小
  const download = useMemo(() => {
    return formatBytes(downloaded);
  }, [downloaded]);

  // 下载速度
  const [speed, setSpeed] = useState("");
  useThrottleEffect(
    () => {
      const currentTime = Date.now();
      const elapsedTimeInSeconds =
        (currentTime - startTime) / 1000;
      const speed = downloaded / elapsedTimeInSeconds;
      const s = formatSpeed(speed);
      setSpeed(s);
    },
    [downloaded],
    { wait: 1000 }
  );

  const handleToggleMinimize = () => {
    dispatch(toggleMinimizeDialog());
  };

  // 最小化的浮动框
  if (showDialog && isMinimized) {
    return (
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 p-2 z-50 animate-in slide-in-from-top duration-300"
        onClick={handleToggleMinimize}
        style={{ cursor: 'pointer' }}
      >
        <div className="bg-background border rounded-lg shadow-lg p-2 min-w-[280px] transition-all duration-300 ease-in-out hover:shadow-xl">
          {step === UPDATER_STEP.DOWNLOAD ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("software_update")}</span>
                <Maximize2 className="w-3 h-3" />
              </div>
              <Progress className="h-2" value={progress} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{speed}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 animate-in fade-in zoom-in duration-500">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                <span>{t("download_complete_tip")}</span>

                <Button
                  className="w-fit !h-8 bg-green-600 hover:bg-green-700 text-white rounded-sm animate-in fade-in zoom-in duration-500 text-sm mr-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(installApp());
                  }}
                >
                  {t("install_now")}
                </Button>

                <div
                  className="h-6 w-6 rounded-sm flex items-center justify-center cursor-pointer z-10 absolute top-4 right-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleMinimize()
                  }}
                >
                  <Maximize2 className="w-3 h-3" />
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    );
  }

  // 正常的对话框
  return (
    <Dialog open={showDialog && !isMinimized}>
      <DialogContent className="sm:max-w-[25rem] rounded-sm" top={10}>
        <DialogHeader>
          <DialogTitle className="text-center text-large flex items-center justify-between">
            <span className="flex-1 text-center">{t("software_update")}</span>
            {/* Maximize2 */}
          </DialogTitle>
          <DialogClose className="absolute top-2 right-4 ">
            <div
              className="h-6 w-6 rounded-sm flex items-center justify-center cursor-pointer "
              onClick={handleToggleMinimize}
            >
              <Minimize2 size={12} />
            </div>
          </DialogClose>
        </DialogHeader>


        {step === UPDATER_STEP.DOWNLOAD ? (
          <div className="flex flex-col gap-4 py-[1rem] h-[4.8rem] box-border">
            <Progress className="h-[1rem]" value={progress} />
            <div className="flex justify-between uf-font-regular text-sm">
              <span>
                {t("speed_label")}
                {speed}
              </span>
              <span>
                {download}/{total}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-between flex-col gap-4 items-center">
            <div className="text-center text-default ">
              {t("download_complete_tip")}
            </div>
            <Button
              className="min-w-[6rem] text-white rounded-sm animate-in fade-in zoom-in duration-500"
              onClick={() => {
                dispatch(installApp());
              }}
            >
              {t("install_now")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
