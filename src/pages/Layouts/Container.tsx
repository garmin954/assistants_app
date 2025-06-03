import { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import SocketState from "./SocketState";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { listen } from "@tauri-apps/api/event";
import store from "@/store";

export default function LayoutContainer() {
  const themeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (themeRef.current) {
      // themeRef.current?.classList.remove("light");
      // themeRef.current?.classList.remove("dark");
      // themeRef.current?.classList.add("dark");
    }
  }, [themeRef]);

  useEffect(() => {
    let un_listen: () => void;

    WebviewWindow.getByLabel("main").then(async (win) => {
      win?.show();
      un_listen = await listen("process-status-update", (res) => {
        store.dispatch({
          type: "app/setAppServerStatus",
          payload: res.payload,
        });
      });
    });

    return () => {
      un_listen?.();
    };
  }, []);

  return (
    <div
      className="h-full bg-background uf-font-regular text-foreground select-none"
      ref={themeRef}
    >
      <SocketState />
      <main className="h-full relative" id="main-container">
        <Outlet />
      </main>
    </div>
  );
}
