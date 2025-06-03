import clsx from "clsx";
import { Loader2 } from "lucide-react";
import React from "react";

type Props = {
  children?: React.ReactNode;
  className?: string;
  text?: string;
  spinning?: boolean;
  size?: number;
  icon?: React.ReactNode;
};
const Loading: React.FC<Props> = (props) => {
  return (
    <div className={clsx("h-full w-full relative")}>
      <div
        className={clsx(
          "w-full text-center flex flex-col gap-2 justify-center items-center py-4 bg-card",
          props.className,
          props.children ? "absolute inset-0" : "visible",
          props.children
            ? props.spinning
              ? "visible"
              : "invisible"
            : "visible"
        )}
      >
        <div>
          {props.icon ?? <Loader2 className="animate-spin" size={30} />}
        </div>

        {props.text !== "" && (
          <p className="text-xl mt-2">{props.text || "加载中..."}</p>
        )}
      </div>

      {props.children}
    </div>
  );
};

export default Loading;
