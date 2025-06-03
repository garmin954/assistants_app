import EmptyPng from "@/assets/images/app/empty.png";
import clsx from "clsx";

interface Props {
  text?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}
export default function Empty(props: Props) {
  return (
    <div
      className={clsx(
        "w-full m-auto text-center select-none pointer-events-none flex items-center justify-center flex-col py-5",
        props.className
      )}
    >
      <img
        src={EmptyPng}
        alt="暂无数据"
        className={clsx(
          "invert-1 dark:invert-[70%] text-default",
          props.size === "sm" ? "w-[6rem]" : "",
          props.size === "md" ? "w-[10rem]" : "",
          !props.size || props.size === "lg" ? "w-[18rem]" : ""
        )}
      />
      <div
        className={clsx(
          "uf-font-regular ",
          props.size === "sm" ? "text-sm" : "",
          props.size === "md" ? "text-lg" : "",
          !props.size || props.size === "lg" ? "text-xl" : ""
        )}
      >
        {props.text || "暂无数据"}
      </div>
    </div>
  );
}
