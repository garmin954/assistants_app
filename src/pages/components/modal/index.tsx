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
  children?: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  open: boolean;
  onConfirm: (v: string) => void;
  onCancel: () => void;
};

export default function Modal(props: Props) {
  const [loading, setLoading] = useState(false);
  function onCancel() {
    props.onCancel();
  }
  async function onConfirm() {
    setLoading(true);
    await props.onConfirm("");
    setLoading(false);
    onCancel();
  }
  return (
    <Dialog open={props.open}>
      <DialogTrigger asChild>
        <div className={props.className} onClick={onCancel}>
          {props.children}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[325px]">
        <DialogHeader>
          <DialogTitle className="text-center text-[1.5rem]">
            {props.title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-6 uf-font-regular text-center text-[1.33rem]">
          {props.description}
        </div>

        <div className="flex justify-center gap-[3rem]">
          <Button variant="outline" onClick={onCancel} className="min-w-[8rem]">
            取消
          </Button>
          <Button
            variant="default"
            onClick={onConfirm}
            className="min-w-[8rem]"
            loading={loading}
          >
            确认
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
