import FilterCriteria from "./FilterCriteria";
import Nav from "./Nav";
import Chart from "./Chart";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { AssistantsState } from "@/store/features/assistants";

function App() {
  const state = useSelector<RootState, AssistantsState>(
    (state) => state.assistants
  );

  return (
    <main className="bg-background text-foreground h-full">
      <Nav />
      <div className="py-[3.2rem] px-[3.4rem] w-full h-[calc(100%-6rem)] bg-transparent flex flex-col">
        <FilterCriteria />
        <Chart
          active={state.curJoint}
          type={state.filter_field.jointType}
          useRad={state.useRad}
        />
      </div>
    </main>
  );
}

export default App;
