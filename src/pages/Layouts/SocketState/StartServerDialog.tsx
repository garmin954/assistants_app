import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import ServerFailPng from "@/assets/images/app/server_fail.png";
import { sleep } from "@/lib/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { AppState } from "@/store/features/app";

type Props = {
  className?: string;
  onConfirm?: (v: string) => void;
  onCancel?: () => void;
};

export default function StartServerDialog(_props: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const state = useSelector<RootState, AppState>((state) => state.app);
  function onCancel() {
    setOpen(false);
  }

  async function onConfirm() {
    setLoading(true);
    await invoke("plugin:commands|start_server");
    await sleep(1500);
    setLoading(false);
    onCancel();
  }

  useEffect(() => {
    invoke("plugin:commands|get_server_state").then((state) => {
      console.log("state==>", state);

      setOpen(!state as boolean);
    });
  }, []);

  useEffect(() => {
    setOpen(!state.server.server_status);
  }, [state.server.server_status]);

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[325px]">
        <DialogHeader>
          <DialogTitle className="text-center uf-font-regular select-none">
            当前服务未开启
          </DialogTitle>
        </DialogHeader>
        <div className="h-[15rem] my-4">
          <img src={ServerFailPng} className="h-full mx-auto select-none" />
        </div>
        <div className="flex justify-center gap-[3rem]">
          <Button
            variant="default"
            onClick={onConfirm}
            className="min-w-[8rem]"
            loading={loading}
          >
            开启服务
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
