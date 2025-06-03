import ReactDOM from "react-dom/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // 从 shadcn/ui 导入 Dialog
import { Button } from "@/components/ui/button";
import clsx from "clsx";

interface ModalOptions {
  content: string | React.ReactNode;
  cancelBtn?: string;
  confirmBtn?: string;
  showCancel?: boolean;
  showConfirm?: boolean;

  width?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
}

const Modal = {
  confirm: (title: string | null, options: ModalOptions) => {
    const {
      cancelBtn = "取消",
      confirmBtn = "确认",
      onCancel,
      onConfirm,
      content = "",
      width = "",
      showCancel = true,
      showConfirm = true,
    } = options;

    // 创建一个 div 作为挂载点
    const mountPoint = document.createElement("div");
    document.body.appendChild(mountPoint);

    // 渲染 Dialog 组件
    const root = ReactDOM.createRoot(mountPoint as HTMLElement);
    const closeModal = () => {
      root.unmount();
      document.body.removeChild(mountPoint);
    };

    const handleConfirm = () => {
      if (onConfirm) onConfirm();
      closeModal();
    };

    const handleCancel = () => {
      if (onCancel) onCancel();
      closeModal();
    };

    root.render(
      // <Dialog open={true} onOpenChange={(open) => !open && closeModal()}>
      <Dialog open={true}>
        <DialogContent
          className={clsx("max-w-none")}
          style={{
            width: width ?? "30rem",
          }}
        >
          <DialogHeader>
            {title && (
              <DialogTitle className="mb-4 text-center">{title} </DialogTitle>
            )}
            <DialogDescription className="text-2xl text-center">
              {content}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-4 justify-center mt-4">
            {showCancel && (
              <Button
                className="min-w-[6.5rem]"
                variant="outline"
                onClick={handleCancel}
              >
                {cancelBtn}
              </Button>
            )}

            {showConfirm && (
              <Button className="min-w-[6.5rem]" onClick={handleConfirm}>
                {confirmBtn}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

export default Modal;
