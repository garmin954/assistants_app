import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & { zIndex?: number | string }
>(({ className, zIndex, style, ...props }, ref) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 bg-black/45",
        className
      )}
      style={{
        ...style,
        zIndex,
      }}
      {...props}
    />
  </motion.div>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { top?: number, width?: string }
>(({ className, children, top, width, ...props }, ref) => {

  const zIndex = "auto";
  const overlayZIndex = "auto";

  const style = React.useMemo(() => {
    const styles: React.CSSProperties = { zIndex }
    if (top !== undefined) {
      styles.top = `${top}rem`;
    }
    if (width !== undefined) {
      styles.width = width;
    }
    return styles;
  }, [top, width, zIndex]);

  return (
    <DialogPortal container={document.getElementById("main-container")}>
      <DialogOverlay zIndex={overlayZIndex} />
      <motion.div
        initial={{ opacity: 0.8, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0.8, y: 50, scale: 0.9 }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 300,
          mass: 1
        }}
        className="fixed top-0 bottom-0 left-0 right-0 grid w-[100vw] h-[100vh]"
        style={{ zIndex }}
      >
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "bg-card absolute grid w-full left-1/2 -translate-x-1/2 gap-4 border px-[3rem] py-[2.5rem] shadow-xl sm:rounded-lg",
            top !== undefined ? `` : "top-1/2 -translate-y-1/2",
            className
          )}
          style={style}
          {...props}
        >
          {children}
        </DialogPrimitive.Content>
      </motion.div>
    </DialogPortal>
  )
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-[1.8rem] font-semibold leading-none tracking-tight uf-font-medium",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-[1.3rem] text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
