import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useXTerm } from "./terminal";
import { FitAddon } from "@xterm/addon-fit";
import clsx from "clsx";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounceFn, useRequest, useSize } from "ahooks";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { useDispatch, useSelector } from "react-redux";
import { RootDispatch, RootState } from "@/store";
import {
  LogState,
  pushCmdsHistory,
  sendCmdAction,
  setCmdPointer,
} from "@/store/features/log";

// 修改 Props 类型，添加新的位置选项
type Props = {
  className?: string;
  onSend?: (command: string) => Promise<any>;
  allow?: boolean;
  children?: React.ReactNode;
  childrenPosition?: "top" | "bottom" | "input_suffix"; // 新增'input'选项
};

export interface TerminalRefType {
  write: (command: string, colour: string) => void;
  send: (command: string) => void;
}

const fit = new FitAddon();

// terminal 组件
export default forwardRef<TerminalRefType, Props>((props, ref) => {
  const state = useSelector<RootState, LogState>((state) => state.log);
  const armConnected = useSelector<RootState, boolean>(
    (state) => state.arm.connected
  );
  const dispatch = useDispatch<RootDispatch>();
  const { instance, ref: termRef } = useXTerm();

  function resize() {
    // instance?.
    instance?.resize(0, 0);

    // setTimeout(() => {
    fit.fit();
    // }, 0);
  }

  useEffect(() => {
    instance?.loadAddon(fit);
    // 复制功能
    instance?.onKey((e) => {
      if (e.key === "\x03") {
        const selectedText = instance.getSelection();
        if (selectedText) {
          writeText(selectedText);
        }
      }
    });
    resize();
  }, [instance]);

  const size = useSize(termRef);
  useEffect(() => resize, [size]);

  const [command, setCommand] = useState("");

  // 发送command

  function send(command: string) {
    if (command) {
      setCommand(command);
      onSendCommand();
    }
  }

  const { run: onSendCommand } = useRequest(
    async () => {
      const cmd = command.toLocaleUpperCase();
      cancelUpperCase();
      if (cmd === "CLEAR") {
        setCommand("");
        onClearLog();
        return Promise.resolve();
      }

      dispatch(pushCmdsHistory(cmd));
      return dispatch(sendCmdAction({ cmd })).finally(() => setCommand(""));
    },
    {
      manual: true,
      debounceWait: 300,
      debounceLeading: true,
      onSuccess: () => {
        cmdRef.current?.focus();
      },
    }
  );

  // 字母自动转大写
  const { run: setUpperCase, cancel: cancelUpperCase } = useDebounceFn(
    (cmd) => {
      setCommand(cmd.toLocaleUpperCase());
    },
    { wait: 500 }
  );
  function onSetCommand(e: React.ChangeEvent<HTMLInputElement>) {
    const cmd = e.target.value; //.toLocaleUpperCase();
    // 判断cmd是否为字母和数字空格，空字符
    if (/^[a-zA-Z0-9\s]+$/.test(cmd) || cmd === "") {
      setCommand(cmd);
      setUpperCase(cmd);
    }
  }

  // 写入日志
  function write(command: string, _colour: string) {
    // command = hexDynamicColor(command, colour);
    // dispatch({ type: "log/write", payload: command });
    instance?.write(command);
  }

  // 写入全局日志
  useEffect(() => {
    instance?.write(state.logs.join(""));
  }, [instance]);

  useEffect(() => {
    if (state.record) {
      instance?.write(state.record);
    }
  }, [state.record]);

  function onClearLog() {
    // setCommand("");
    instance?.clear();
    return dispatch({
      type: "log/clear",
    });
  }

  // 暴露组件方法
  useImperativeHandle(ref, () => ({
    write,
    send,
  }));

  const disabled = useMemo(() => {
    if (props.allow) {
      return state.sendLoading;
    }
    return state.sendLoading || !armConnected;
  }, [state.sendLoading, armConnected, props.allow]);

  const cmdRef = useRef<HTMLInputElement>(null);

  // 处理键盘事件
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const len = state.cmdsHistory.length;
    if (["ArrowUp", "ArrowDown"].includes(e.key) && len > 0) {
      const index = state.cmdPointer + (e.key === "ArrowUp" ? 1 : -1);

      if (len - index in state.cmdsHistory) {
        dispatch(setCmdPointer(index));
        const cmd = state.cmdsHistory[len - index];
        setCommand(cmd);
        e.currentTarget.focus();
        setTimeout(() => {
          (e.target as HTMLInputElement).setSelectionRange(
            cmd.length,
            cmd.length
          );
        }, 0);
      }
    }

    // enter键
    if (e.key === "Enter") {
      onSendCommand();
      e.preventDefault();
      e.currentTarget.blur();
    }
  }
  return (
    <div className={clsx("h-full flex flex-col relative ", props.className)}>
      {props.childrenPosition === "top" && props.children && (
        <div className="mb-2">{props.children}</div>
      )}

      <div className="flex-1 w-full h-0" ref={termRef}></div>
      <div className="h-[4.75rem]" />

      {props.childrenPosition !== "top" &&
        props.childrenPosition !== "input_suffix" &&
        props.children && <div className="mb-2 mt-2">{props.children}</div>}

      <div className="flex w-full space-x-4 absolute bottom-[-3.55rem] left-0 right-0 h-[9.75rem] bg-card pb-[4rem] items-end">
        <div className="relative flex-1">
          <Input
            type="text"
            ref={cmdRef}
            placeholder="请输入"
            className="!h-[4.2rem] flex-1 focus:outline-none focus:ring-0 pl-6 z-10"
            value={command}
            onChange={onSetCommand}
            onKeyDown={(e) => handleKeyDown(e)}
            disabled={disabled}
          />

          {props.childrenPosition === "input_suffix" && props.children}
        </div>

        <Button
          className="bg-primary !h-[4.2rem] w-[6.88rem] text-[1.3rem]"
          type="submit"
          onClick={() => onSendCommand()}
          disabled={!command || state.sendLoading}
          loading={state.sendLoading}
        >
          发送
        </Button>
      </div>

      <div
        title="clean"
        className="absolute -top-[2.6051rem] -right-[2.45rem] cursor-pointer"
        onClick={() => onClearLog()}
      >
        <i className="iconfont icon-clear text-[2.5rem] font-[500]" />
      </div>
    </div>
  );
});
