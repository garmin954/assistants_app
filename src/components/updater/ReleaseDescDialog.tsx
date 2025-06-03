import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import "github-markdown-css/github-markdown.css";

type Props = {
  children?: React.ReactNode;
  onInstall: () => void;
  onClose: () => void;
  className?: string;
  show: boolean;
  version: string;
  content: string;
};

export default function ReleaseDescDialog(props: Props) {
  const [open, setOpen] = useState(false);

  function close() {
    props?.onClose();
    setOpen(false);
  }

  useEffect(() => {
    console.log("props.show", props.show);

    setOpen(props.show);
  }, [props.show]);

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[525px] ">
        <DialogClose
          onClick={() => close()}
          className="absolute right-[2.2rem] top-[2rem] rounded-sm opacity-70 hover:bg-gray-200/80 w-[3rem] h-[3rem] flex justify-center items-center"
        >
          <X className="h-[2rem] w-[2.5rem]" />
        </DialogClose>
        <DialogHeader>
          <DialogTitle className="text-center">
            {`v${props.version} 版本更新信息`}
          </DialogTitle>
        </DialogHeader>
        <div
          className="py-6 h-[60vh] overflow-y-auto text-xl markdown-body"
          dangerouslySetInnerHTML={{
            __html: props.content ?? "暂无版本信息",
          }}
        ></div>

        <div className="flex justify-center gap-[3rem]">
          <Button
            variant="default"
            onClick={() => {
              close();
              props.onInstall();
            }}
            className="min-w-[8rem]"
          >
            立即下载
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
