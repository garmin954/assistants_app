import React from "react";
import { motion, MotionProps } from "framer-motion";

// 定义高阶组件的泛型类型参数，用于接收任意类型的组件作为参数
type WrappedComponentType = React.ComponentType<any>;

// 定义高阶组件函数，传入一个组件类型参数，并返回一个新的组件类型
const withMotionDiv = <T extends WrappedComponentType>(
  WrappedComponent: T,
  customMotionProps: MotionProps = {}
): React.FC<React.ComponentProps<T>> => {
  // 定义新的组件类型，继承自React.FC，并传入原始组件的属性类型作为泛型参数
  const AnimatedComponent: React.FC<React.ComponentProps<T>> = (
    props: React.ComponentProps<T>
  ) => {
    // 定义motion.div所需的动画属性
    const motionDivProps: MotionProps = {
      ...{
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      },
      ...customMotionProps,
    };

    return (
      <motion.div {...motionDivProps} {...props} className="h-full w-full">
        <WrappedComponent {...props} />
      </motion.div>
    );
  };

  return AnimatedComponent;
};

export default withMotionDiv;
