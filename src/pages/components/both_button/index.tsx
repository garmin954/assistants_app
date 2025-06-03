// react组件
import { Button } from "@/components/ui/button";
import Spin from "../loading";
import { Loader } from "lucide-react";
import clsx from "clsx";

type Props = {
  className?: string;
  r_loading?: boolean;
  l_loading?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>, type: string) => void;
  options: {
    value: string;
    label: string;
    loading: boolean;
  }[];
};
const BothButton: React.FC<Props> = ({
  className,
  onClick,
  disabled,
  options,
}) => {
  const handleOnClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    type: string
  ) => {
    console.log("handleOnClick");
    onClick && onClick(e, type);
  };
  return (
    <div
      className={clsx(
        "flex gird-cols-3 gird shadow-sm border w-full h-default  justify-center items-center rounded-md relative",
        className
      )}
    >
      {options.map(({ value, label, loading }) => (
        <Spin
          key={value}
          text=""
          spinning={loading}
          icon={<Loader className="animate-spin" size={18} />}
        >
          <Button
            disabled={disabled || loading}
            className="h-full rounded-none w-full text-[1.1rem]"
            onClick={(e) => handleOnClick(e, value)}
          >
            {label}
          </Button>
        </Spin>
      ))}

      <div className="bg-[#CDE1FD] h-1/3 block w-[1px] absolute left-1/2 z-10">
        {" "}
      </div>
    </div>
  );
};

export default BothButton;
