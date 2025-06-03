import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  description?: React.ReactNode;
  image?: React.ReactNode;
}

const Empty = React.forwardRef<HTMLDivElement, EmptyProps>(
  ({ className, description, image, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center p-8 text-center",
          className
        )}
        {...props}
      >
        {image && (
          <div className="mb-4">
            {image}
          </div>
        )}
        {description && (
          <div className="text-muted-foreground text-lg">
            {description}
          </div>
        )}
        {children}
      </div>
    );
  }
);

Empty.displayName = "Empty";

export { Empty };