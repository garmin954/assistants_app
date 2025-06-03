import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  className?: string;
  status: string;
};

export default function StateDialog(props: Props) {
  const [open, setOpen] = useState(false);
  function onCancel() {
    setOpen(false);
  }
  useEffect(() => {
    if (props.status === "Connecting") {
      setOpen(true);
      return;
    }

    if (props.status === "Open") {
      setOpen(false);
    }
    // setOpen(false);
    return () => {
      setOpen(false);
    };
  }, [props.status]);
  return (
    <Dialog open={open}>
      <DialogTrigger asChild>
        <div className={props.className} onClick={onCancel}></div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[325px] sm:rounded-sm">
        <DialogHeader>
          <DialogTitle className="text-center"></DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-6 text-[1.6rem] text-center">
          <Loader2Icon
            className="mx-auto animate-spin duration-1000"
            size={40}
          />
          <div className="uf-font-medium">服务连接中</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
