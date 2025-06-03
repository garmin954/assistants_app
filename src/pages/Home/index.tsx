import FilterCriteria from "./FilterCriteria";
import Nav from "./Nav";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Chart from "./Chart";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { AssistantsState } from "@/store/features/assistants";

function App() {
  const state = useSelector<RootState, AssistantsState>(
    (state) => state.assistants
  );
  useEffect(() => {
    return () => {
      // 清理副作用，例如取消订阅事件
      // command.kill();
    };
  }, []);

  // useWhyDidYouUpdate('Observe', {...state});
  const { t: _t } = useTranslation();

  // useEffect(() => {
  //   worker.onmessage = (event: MessageEvent) => {
  //     console.log("event===>", event);
  //   };
  // }, []);
  const jointChartBoxRef = useRef(null);

  return (
    <main className="bg-background text-foreground h-full">
      <Nav />

      <div className="py-[3.2rem] px-[3.4rem] w-full h-[calc(100%-6rem)] bg-transparent flex flex-col">
        <FilterCriteria />
        <Chart
          ref={jointChartBoxRef}
          active={state.curJoint}
          type={state.filter_field.jointType}
          useRad={state.useRad}
        />
        {/* <div className="pt-[3.2rem] grid grid-cols-3 grid-rows-2 gap-x-[1.8rem] gap-y-[2rem] flex-1 overflow-hidden">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-full overflow-hidden"></div>
          ))}
        </div> */}
      </div>
    </main>
  );
}

export default App;
