import { useEffect,  } from "react";
import "github-markdown-css/github-markdown.css";
import ReleaseDescDialog from "./ReleaseDescDialog";
import DownloadProgress from "./DownloadProgress";
import useUpdater from "./useUpdater";

// @ts-ignore
interface Props {
  className?: string;
  isBeta?: boolean;
}
export default function LogicUpdater() {
  const {state,  onCloseUpdaterDialog, onDownloadApp} = useUpdater();

  useEffect(() => {
    // onCheckUpdater();
    console.log('state.updater==>', state.updater);
    
  }, [])


  const upd = state.updater;

  return (
    <>
      {/* <Button
        className={clsx("h-[3.5rem] min-w-[8rem]", className)}
        onClick={onUpdate}
        loading={state.isLoading}
      >
        {state.step === UPDATER_STEP.CHECK && "检查更新"}
        {state.step === UPDATER_STEP.DOWNLOAD && `新版本v${upd.version}`}
        {state.step === UPDATER_STEP.INSTALL && "立即更新"}
        {state.step === UPDATER_STEP.NORMAL && "最新版本，无需更新"}
      </Button> */}

      <ReleaseDescDialog
        show={state.openRelease}
        onInstall={() => onDownloadApp()}
        onClose={() => onCloseUpdaterDialog()}
        content={upd.body.content}
        version={upd.version}
      />

      <DownloadProgress />
    </>
  );
}
