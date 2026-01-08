import { UPDATER_STEP } from "@/lib/constant";
import { RootDispatch, RootState } from "@/store";
import {
  checkUpdater,
  UpdaterState,
  downloadApp,
  closeDownloadDialog,
} from "@/store/features/updater";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ReleaseDescDialog from "./ReleaseDescDialog";
import DownloadProgress from "./DownloadProgress";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

interface Props {
  className?: string;
  isBeta?: boolean;
}
export default function LogicUpdater(props: Props) {
  const { i18n, t } = useTranslation("updater");
  const { isBeta = false } = props;
  const state = useSelector<RootState, UpdaterState>((state) => state.updater);
  const dispatch = useDispatch<RootDispatch>();
  const [showDesc, setShowDesc] = useState(false);

  async function onUpdate() {
    switch (state.step) {
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
  }
  const upd = state.updater;

  useEffect(() => {
    onUpdate()
  }, []);

  function handleInstall() {
    setShowDesc(false)
    dispatch(downloadApp())
  }

  return (
    <>
      {
        state.step === UPDATER_STEP.DOWNLOAD || state.step === UPDATER_STEP.INSTALL ? (
          <Button
            className={clsx("min-w-[8rem] relative")}
            onClick={onUpdate}
            loading={state.isLoading}
            variant="outline"
          >
            <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-green-500 "></div>
            {state.step === UPDATER_STEP.DOWNLOAD && t("new_version_v", { version: upd.version })}
            {state.step === UPDATER_STEP.INSTALL && t("install_now")}
          </Button>
        ) : null
      }


      <ReleaseDescDialog
        show={showDesc}
        onInstall={handleInstall}
        onClose={() => setShowDesc(false)}
        content={i18n.language === "cn" ? upd.body.content.cn : upd.body.content.en}
        version={upd.version}
      />

      <DownloadProgress />
    </>
  );
}
