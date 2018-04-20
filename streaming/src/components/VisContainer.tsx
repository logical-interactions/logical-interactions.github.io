import * as React from "react";


import { db } from "../sql/setup";
import LineChart from "./LineChart";
import BarChart from "./Barchart";
import { aSeries, bSeries, chartAName, chartBName, chartScatterName, getNextData, setBarChartStateHelper, setLineChartStateHelper, setupDial } from "../sql/streaming/customSetup";

// refreshAllCharts

interface VisContainerState {
  start: number;
  interval: number;
  maxTime: number;
}

export default class VisContainer extends React.Component<undefined, VisContainerState> {
  lineChart: LineChart;
  chartA: BarChart;
  chartB: BarChart;

  constructor(props: undefined) {
    super(props);
    this.refreshAllCharts = this.refreshAllCharts.bind(this);
    this.newWindow = this.newWindow.bind(this);
    setupDial();
    let maxTime = db.exec(`select max(ts) from events`)[0].values[0][0] as number;
    this.state = {
      start: 0,
      interval: 100,
      maxTime
    };
  }
  componentDidMount() {
    db.create_function("refreshAllCharts", this.refreshAllCharts);
    getNextData(this.state.start, this.state.interval);
    // also set things up
    // also insert the first specification for window
    // let's hard code to 10 at a time
  }
  refreshAllCharts() {
    setLineChartStateHelper("chartTimeData", this.lineChart);
    setBarChartStateHelper("chartAData", this.chartA);
    setBarChartStateHelper("chartBData", this.chartB);
  }
  // this logic need to be fixed depending o what we end up with
  newWindow() {
    // get current
    // Note: need to update this logic if new data is actually coming
    // let maxTime = db.exec(`select max(ts) from events`)[0].values[0][0] as number;
    this.setState(prevState => {
      return {
        start: prevState.start + prevState.interval
      };
    });
    getNextData(this.state.start, this.state.start + this.state.interval);
  }
  render() {
    // see if there are new data
    let newDataDisabled = false;
    if (this.state.maxTime < this.state.start + this.state.interval) {
      newDataDisabled = true;
    }
    return (<>
      <button onClick={this.newWindow} disabled={newDataDisabled}>New Data</button>
      <LineChart ref={l => this.lineChart = l}/>
      <BarChart
        ref={b => this.chartA = b}
        chartName={chartAName}
        series={aSeries}
      />
      <BarChart
        ref={b => this.chartB = b}
        chartName={chartBName}
        series={bSeries}
      />
    </>);
  }
}