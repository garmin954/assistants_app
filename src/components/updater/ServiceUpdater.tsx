import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

import { open as openFile } from "@tauri-apps/plugin-dialog";
import { Upload } from "lucide-react";
import { DragDropEvent, getCurrentWebview } from "@tauri-apps/api/webview";
import { Event, UnlistenFn } from "@tauri-apps/api/event";
import { isPointInsideDiv } from "@/lib/utils";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useRequest } from "ahooks";
import { invoke } from "@tauri-apps/api/core";

type Props = {
  onShow: (state: boolean) => void;
  show: boolean;
};

export default function ServiceUpdater(props: Props) {
  const { show, onShow } = props;

  useEffect(() => {
    const w = getCurrentWebview();
    let unlisten: UnlistenFn;
    w.onDragDropEvent(handleDragEvent).then((r) => (unlisten = r));

    return () => {
      unlisten?.();
    };
  }, []);

  const [updaterPath, setUpdaterPath] = useState("");
  function handleDragEvent(event: Event<DragDropEvent>): void {
    // 离开
    if (event.payload.type === "leave") {
      setIsDragging(false);
      return;
    }
    const { type, position } = event.payload;

    // 在区域里面
    const inside = isPointInsideDiv(position, updaterAreaRef.current!);

    if (type === "over") {
      setIsDragging(inside);
      return;
    }
    const { paths } = event.payload;

    if (type === "enter") {
      return;
    }

    // 放下
    if (type === "drop") {
      setIsDragging(false);
      if (inside) {
        if (paths.length > 1) {
          toast.warning("只能上传一个文件，系统将默认选择第一个文件进行上传");
        }
        setUpdaterPath(paths[0]);
      }
    }
  }

  function close() {
    onShow(false);
  }

  const [isDragging, setIsDragging] = useState(false);

  const updaterAreaRef = useRef<HTMLDivElement>(null);

  async function openFileManger() {
    const file = await openFile({
      multiple: false,
      filters: [
        {
          name: "二进制服务文件",
          extensions: ["exe"],
        },
      ],
    });

    if (file) {
      setUpdaterPath(file);
    }
  }

  const { run: handleUpdaterService, loading } = useRequest(
    async () => {
      return await invoke("plugin:commands|updater_service", {
        path: updaterPath,
      });
    },
    {
      debounceLeading: true,
      manual: true,
      debounceWait: 1000,
      onSuccess(r) {
        if (r === "success") {
          toast.success("服务升级成功");
          close();
          return;
        }
        toast.warning("服务升级失败:" + r);
      },
      onError(e) {
        toast.error("服务升级失败:" + e);
      },
    }
  );

  return (
    <Dialog open={show}>
      <DialogContent className="sm:max-w-[525px] top-[2rem]">
        <DialogClose
          onClick={() => close()}
          className="absolute right-[2.2rem] top-[2rem] rounded-sm opacity-70 hover:bg-gray-200/80 w-[3rem] h-[3rem] flex justify-center items-center"
        >
          <X className="h-[2rem] w-[2.5rem]" />
        </DialogClose>
        <DialogHeader>
          <DialogTitle className="text-center">{`后端服务升级`}</DialogTitle>
        </DialogHeader>
        <div className="py-6  overflow-y-auto text-xl markdown-body">
          <div className="space-y-6">
            <div
              data-tauri-drag-region
              ref={updaterAreaRef}
              className={clsx(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-gray-200",
                "hover:border-primary hover:bg-primary/5",
                loading ?? "pointer-events-none"
              )}
            >
              <div
                className="flex flex-col items-center gap-2"
                data-tauri-drag-region
              >
                <Upload
                  className="h-8 w-8 text-gray-400"
                  data-tauri-drag-region
                />
                <p className="text-xl text-gray-600" data-tauri-drag-region>
                  将文件拖放到此处，或者{" "}
                  <button
                    data-tauri-drag-region
                    onClick={() => openFileManger()}
                    className="text-primary hover:underline"
                  >
                    浏览
                  </button>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="输入目标路径"
                  onChange={(e) => setUpdaterPath(e.target.value)}
                  value={updaterPath}
                  disabled={loading}
                />
                <Button
                  onClick={() => openFileManger()}
                  disabled={loading}
                  className="whitespace-nowrap"
                >
                  选择文件
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-[3rem]">
          <Button
            variant="default"
            onClick={handleUpdaterService}
            className="min-w-[8rem]"
            loading={loading}
          >
            立即升级
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
