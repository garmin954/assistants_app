import * as React from "react";

import { cn } from "@/lib/utils";

type ExpandProps = {
  fixed?: number;
  prefix?: string; // 添加前缀属性
  prefixCls?: string; // 添加前缀样式属性
};
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    ExpandProps {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, autoFocus = true, prefix, prefixCls, ...props }, ref) => {
    function handleOnBlur(e: React.FocusEvent<HTMLInputElement, Element>) {
      if (
        type === "number" &&
        props.max !== undefined &&
        props.min !== undefined
      ) {
        const inputValue = e.currentTarget.value;
        if (
          inputValue !== "" &&
          inputValue != undefined &&
          inputValue != null
        ) {
          let value: number;

          if (/^\d*\.?\d+$/.test(inputValue)) {
            // 如果输入是小数，使用 Number 函数转换并保留小数精度
            value = Number(inputValue);
          } else {
            value = parseInt(inputValue, 10);
          }

          if (props?.fixed) {
            e.currentTarget.value = value.toFixed(props?.fixed);
          }
          const minValue = Number(props.min);
          const maxValue = Number(props.max);
          const errorMargin = 0.01; // 设置一个小的误差范围
          if (value > maxValue + errorMargin) {
            e.currentTarget.value = props.max.toString();
          } else if (value < minValue - errorMargin) {
            e.currentTarget.value = props.min.toString();
          }

          e.currentTarget.value = e.currentTarget.value || "0";
        }

        props.onInput?.(e);
        props.onChange?.(e);
      }
      props.onBlur?.(e);
    }

    // 修改 Input 组件中的前缀样式，确保不会挡住输入光标
    return (
      <div className={cn("relative flex items-center w-full")}>
        {prefix && (
          <div
            className={cn(
              "absolute left-1 top-1/2 -translate-y-1/2  flex items-center justify-center p-1 rounded-sm bg-background",
              "text-muted-foreground text-lg pointer-events-none",
              prefixCls
            )}
          >
            {prefix}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-default w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground ",
            "placeholder:text-disabled focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50 text-lg un-spin",
            prefix && "pl-[4rem]",
            className
          )}
          autoFocus={autoFocus}
          ref={ref}
          {...props}
          onBlur={(e) => handleOnBlur(e)}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
