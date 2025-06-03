import { Provider } from "react-redux";
import store from "./store";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter } from "react-router-dom";
import RouterConfig from "./router";
import { ThemeProvider } from "./pages/components/theme/ThemeProvider";
import { useKeyPress } from "ahooks";
import LogicUpdater from "./components/updater/LogicUpdater";

// 打印rust日志
// import { attachConsole } from "@tauri-apps/plugin-log";
// attachConsole();
function App() {
  useKeyPress("ctrl.alt.f12", () => {});
  return (
    <ThemeProvider>
      <Provider store={store}>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <RouterConfig />
          <Toaster />
        </BrowserRouter>
        <LogicUpdater />
      </Provider>
    </ThemeProvider>
  );
}

export default App;
