import React, { Suspense } from "react";
import { useRoutes } from "react-router-dom";
import { routes } from "./routes";
import { PuffLoader } from "react-spinners";
import { useTauriInit } from "@/hooks/tauri";
import { useHotkeyInit, useSettingUnmounted } from "@/hooks/system";
const RoutersList = () => {
  const RoutersList = useRoutes(routes);
  return RoutersList;
};
const RouterConfig: React.FC = () => {
  useTauriInit();
  useSettingUnmounted();
  useHotkeyInit();

  return (
    <Suspense
      fallback={
        <PuffLoader className="left-1/2 fixed top-1/2" color="#3662EC" />
      }
    >
      <RoutersList />
    </Suspense>
  );
};
export default RouterConfig;
