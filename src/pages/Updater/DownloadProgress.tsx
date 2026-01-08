import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { UPDATER_STEP } from "@/lib/constant";
import { formatBytes, formatSpeed } from "@/lib/utils";
import { RootDispatch } from "@/store";
import { installApp } from "@/store/features/updater";
import { useThrottleEffect } from "ahooks";
import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/hooks/reduxHooks";

export default function DownloadProgress() {
  const showDialog = useAppSelector(state => state.updater.download.showDialog);
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

  return (
    <Dialog open={showDialog}>
      <DialogContent className="sm:max-w-[25rem] rounded-sm" top={10}>
        <DialogHeader>
          <DialogTitle className="text-center text-large">
            {t("software_update")}
          </DialogTitle>
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
              className="min-w-[6rem] rounded-sm"
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

