import clsx from "clsx";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  className?: string;
  options: { [props: string]: string }[];
  active: string;
  onChange: (key: string) => void;
};

type TabRefs = { [key: string]: HTMLDivElement };
function Tabs(props: Props, ref: React.ForwardedRef<HTMLDivElement>) {
  const tabRefs = useRef<TabRefs>({});
  const [tabValue, setTabValue] = useState("");

  useEffect(() => {
    setTabValue(props.active);
  }, [props.active]);
  function handleOnClick(key: string) {
    if (key !== props.active) {
      props.onChange(key);
    }
  }

  const pos = useMemo(() => {
    return tabRefs.current[tabValue];
  }, [tabValue, tabRefs]);

  return (
    <div
      className={clsx(
        "flex relative cursor-pointer gap-[1rem] items-center",
        props.className
      )}
      ref={ref}
    >
      {props.options.map((item) => (
        <div
          key={item.value}
          className={clsx(
            "text-center border-transparent px-[1.5rem] h-full flex items-center uf-font-medium text-[1.33rem]",
            item.value === tabValue ? "text-primary" : "text-subtext"
          )}
          onClick={() => handleOnClick(item.value)}
          ref={(r) => (tabRefs.current[item.value] = r!)}
        >
          {item.label}
        </div>
      ))}

      {pos ? (
        <div
          className={clsx(
            "w-[3rem] border-b-[0.21rem] absolute bottom-0 left-[0%] border-primary rounded-lg",
            "transition-all duration-300"
          )}
          style={{
            transform: `translateX(${pos.offsetLeft}px)`,
            width: pos.offsetWidth,
          }}
        />
      ) : null}
    </div>
  );
}

export default forwardRef<HTMLDivElement, Props>(Tabs);
