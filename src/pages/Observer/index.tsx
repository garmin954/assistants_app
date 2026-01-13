import FilterCriteria from "./FilterCriteria";
import Nav from "./Nav";
import Chart from "./Chart";
import Version from "./Version";

function ObserverChart() {

  return (
    <main className="bg-background text-foreground h-full">
      <Nav />
      <div className="py-[3.2rem] px-[3.4rem] w-full h-[calc(100%-6rem)] bg-transparent flex flex-col">
        <FilterCriteria />
        <Chart />
      </div>

      <Version />

    </main>
  );
}

export default ObserverChart;
