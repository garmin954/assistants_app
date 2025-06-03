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
import { installApp, UpdaterState } from "@/store/features/updater";
import { useThrottleEffect } from "ahooks";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function DownloadProgress() {
  const state = useSelector<RootState, UpdaterState>((state) => state.updater);
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
          <DialogTitle className="text-center">软件更新</DialogTitle>
        </DialogHeader>

        {state.step === UPDATER_STEP.DOWNLOAD ? (
          <div className="flex flex-col gap-4 py-[3rem] h-[10rem] box-border">
            <Progress className="h-[1.5rem]" value={state.download.progress} />
            <div className="flex justify-between uf-font-regular">
              <span>网速：{speed}</span>
              <span>
                {download}/{total}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-between flex-col gap-4 items-center h-[10rem]">
            <div className="text-center text-2xl mt-8">
              安装包下载完成，点击立即安装
            </div>
            <Button
              onClick={() => {
                dispatch(installApp());
              }}
            >
              立即安装
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
