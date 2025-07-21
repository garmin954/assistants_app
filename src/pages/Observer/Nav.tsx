import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo } from "react";
import { useState } from "react";
import {
  connectPortServer,
  disconnectPortServer,
} from "@/store/features/assistants";
import { useRequest } from "ahooks";
import { useDispatch, useSelector } from "react-redux";
import { RootDispatch, RootState } from "@/store";
import { AssistantsState } from "@/store/features/assistants";
import { getCurrentWindow } from "@tauri-apps/api/window";

const Languages = [
  {
    name: "English",
    code: "en-US",
  },
  {
    name: "中文",
    code: "zh-CN",
  },
];


export default function Nav() {
  const { t, i18n } = useTranslation();

  const dispatch = useDispatch<RootDispatch>();
  const state = useSelector<RootState, AssistantsState>(
    (state) => state.assistants
  );

  useEffect(() => {
    changeLanguage(i18n.language);
  }, []);

  // 切换语言
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    getCurrentWindow().setTitle(t("appTitle"));
  };

  const curLang = useMemo(() => {
    return Languages.find((item) => item.code === i18n.language);
  }, [i18n.language]);

  const [ipAddress, setIpAddress] = useState("192.168.1.");
  const [isValidIp, setIsValidIp] = useState(true);

  const validateIp = (ip: string) => {
    const ipRegex =
      /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  const handleIpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIpAddress(value);
    setIsValidIp(value === "" || validateIp(value));
  };

  const { run: onConnectPortServer, loading: connectLoading } = useRequest(
    async () => {
      if (!isValidIp || !ipAddress) {
        return;
      }
      return dispatch(connectPortServer(ipAddress));
    },
    {
      manual: true,
      debounceWait: 300,
      debounceLeading: true,
    }
  );

  const { run: onDisconnectPortServer, loading: disconnectLoading } =
    useRequest(
      async () => {
        return dispatch(disconnectPortServer());
      },
      {
        manual: true,
        debounceWait: 300,
        debounceLeading: true,
      }
    );

  function onHandelConnectServer() {
    if (state.server_state) {
      onDisconnectPortServer();
    } else {
      onConnectPortServer();
    }
  }

  return (
    <nav className="bg-card w-full shadow-xs px-[3.4rem] py-[1.13rem] flex justify-between h-[6rem] leading-[6rem]">
      <div className="flex gap-4 items-center">
        <Input
          placeholder={t("address_ip")}
          className={`bg-input w-[15rem] h-[3rem] text-xl ${!isValidIp ? "border-red-500" : ""
            }`}
          value={ipAddress}
          onChange={handleIpChange}
          readOnly={state.server_state}
          type="ip"
        />
        <Button
          disabled={!isValidIp || !ipAddress}
          onClick={onHandelConnectServer}
          loading={connectLoading || disconnectLoading}
        >
          {state.server_state ? t("disconnect") : t("connect")}
        </Button>
      </div>

      <Select onValueChange={changeLanguage} defaultValue={i18n.language}>
        <SelectTrigger className="min-w-[7rem] max-w-[10rem] w-fit">
          <SelectValue placeholder={curLang?.name}></SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Languages.map((item) => {
            return (
              <SelectItem value={item.code} key={item.code}>
                {item.name}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </nav>
  );
}
