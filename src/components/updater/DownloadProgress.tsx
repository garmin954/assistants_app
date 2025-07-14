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
import { RootDispatch, RootState } from "@/store";
import { installApp } from "@/store/features/updater";
import { useThrottleEffect } from "ahooks";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { shallowEqual, useDispatch, useSelector } from "react-redux";

const DownloadProgress = React.memo(() => {
  const { t } = useTranslation();
  const state = useSelector(
    (state: RootState) => ({
      step: state.updater.step,
      download: state.updater.download,
    }),
    shallowEqual // 浅比较，避免无关字段变化触发渲染
  );
  const dispatch = useDispatch<RootDispatch>();

  // 安装包大小
  const total = useMemo(() => {
    return formatBytes(state.download.totalSize);
  }, [state.download.totalSize]);

  // 已下载大小
  const download = useMemo(() => {
    return formatBytes(state.download.downloaded);
  }, [state.download.downloaded]);

  // 下载速度
  const [speed, setSpeed] = useState("");
  useThrottleEffect(
    () => {
      const currentTime = Date.now();
      const elapsedTimeInSeconds =
        (currentTime - state.download.startTime) / 1000;
      const speed = state.download.downloaded / elapsedTimeInSeconds;
      const s = formatSpeed(speed);
      setSpeed(s);
    },
    [state.download.downloaded],
    { wait: 1000 }
  );

  return (
    <Dialog open={state.download.showDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">
            {t("version_title")}
          </DialogTitle>
        </DialogHeader>

        {state.step === UPDATER_STEP.DOWNLOAD ? (
          <ProgressSection
            progress={state.download.progress}
            speed={speed}
            download={download}
            total={total}
          />
        ) : (
          <InstallSection onInstall={() => dispatch(installApp())} />
        )}
      </DialogContent>
    </Dialog>
  );
});

type ProgressSectionProps = {
  progress: number;
  speed: string;
  download: string;
  total: string;
};
const ProgressSection = React.memo<ProgressSectionProps>(
  ({ progress, speed, download, total }) => {
    const { t } = useTranslation();
    return (
      <div className="flex flex-col gap-4 py-[3rem] h-[10rem] box-border">
        <Progress className="h-[1.5rem]" value={progress} />
        <div className="flex justify-between uf-font-regular">
          <span>
            {t("network_speed")}:{speed}
          </span>
          <span>
            {download}/{total}
          </span>
        </div>
      </div>
    );
  }
);

type InstallSectionProps = {
  onInstall: () => void;
};
const InstallSection = React.memo<InstallSectionProps>(({ onInstall }) => {
  const { t } = useTranslation();
  return (
    <div className="flex justify-between flex-col gap-4 items-center h-[10rem]">
      <div className="text-center text-2xl mt-8">{t("install_tips")}</div>
      <Button onClick={onInstall}>{t("install_now")}</Button>
    </div>
  );
});
export default DownloadProgress;
