import { RootDispatch } from "@/store";
import { setSharedData } from "@/store/features/app";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { Outlet } from "react-router-dom";

export default function LayoutContainer() {
  const themeRef = useRef<HTMLDivElement>(null);

  console.log("LayoutContainer-----------");
  const dispatch = useDispatch<RootDispatch>();

  useEffect(() => {
    let unListen: () => void;
    listen("APP_SHARED_STATE", (rs) => {
      dispatch(setSharedData(rs.payload));
    }).then((r) => (unListen = r));

    invoke("get_shared_state")
    return () => {
      unListen?.();
    };
  }, []);

  return (
    <div
      className="h-full bg-background uf-font-regular text-foreground select-none"
      ref={themeRef}
    >
      <main className="h-full relative" id="main-container">
        <Outlet />
      </main>
    </div>
  );
}
