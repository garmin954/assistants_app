import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SpinningProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
  fullscreen?: boolean;
}

const Spinning = React.forwardRef<HTMLDivElement, SpinningProps>(
  ({ className, size = 24, fullscreen = false, ...props }, ref) => {
    if (fullscreen) {
      return (
        <div
          ref={ref}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-background/80",
            className
          )}
          {...props}
        >
          <Loader2 className="animate-spin" size={size} />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <Loader2 className="animate-spin" size={size} />
      </div>
    );
  }
);

Spinning.displayName = "Spinning";

export { Spinning };