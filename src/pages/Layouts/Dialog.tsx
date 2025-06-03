import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  onConfirm: (v: string) => void;
  onCancel: () => void;
};

export default function UpdaterDialog(props: Props) {
  const [open, setOpen] = useState(false);
  function onCancel() {
    setOpen(false);
  }
  function onConfirm() {
    // props.onConfirm("");
    // onCancel();
  }
  return (
    <Dialog open={open}>
      <DialogTrigger asChild>
        <div className={props.className} onClick={() => setOpen(true)}>
          {props.children}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[325px]">
        <DialogHeader>
          <DialogTitle className="text-center">新增测试IP</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-6"></div>

        <div className="flex justify-center gap-[3rem]">
          <Button variant="outline" onClick={onCancel} className="min-w-[8rem]">
            取消
          </Button>
          <Button
            variant="default"
            onClick={onConfirm}
            className="min-w-[8rem]"
          >
            确认
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
