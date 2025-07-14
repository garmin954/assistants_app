import { Provider } from "react-redux";
import store from "./store";
import { BrowserRouter } from "react-router-dom";
import RouterConfig from "./router";
import LogicUpdater from "./components/updater/LogicUpdater";
import { ThemeProvider } from "./pages/components/theme/ThemeProvider";

// 打印rust日志
// import { attachConsole } from "@tauri-apps/plugin-log";
// attachConsole();
function App() {
  console.log("App---------------->");

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
        </BrowserRouter>
        <LogicUpdater />
      </Provider>
    </ThemeProvider>
  );
}

export default App;
