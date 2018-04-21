import * as React from "react";


import { db } from "../sql/setup";
import { Designs } from "../lib/helper";
import LineChart from "./LineChart";
import BarChart from "./Barchart";
import { aSeries, bSeries, chartAName, chartBName, chartScatterName, getNextData, setBarChartStateHelper, setLineChartStateHelper, setupDial } from "../sql/streaming/customSetup";

// refreshAllCharts

interface VisContainerProps {
}

interface VisContainerState {
  design: Designs;
  start: number;
  interval: number;
  maxTime: number;
}

export default class VisContainer extends React.Component<VisContainerProps, VisContainerState> {
  lineChart: LineChart;
  chartA: BarChart;
  chartB: BarChart;

  constructor(props: VisContainerProps) {
    super(props);
    this.refreshAllCharts = this.refreshAllCharts.bind(this);
    this.newWindow = this.newWindow.bind(this);
    setupDial();
    let maxTime = db.exec(`select max(ts) from events`)[0].values[0][0] as number;
    this.state = {
      start: 0,
      interval: 100,
      design: Designs.REMOVE,
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
    switch (this.state.design) {
      case Designs.REMOVE: {
        // remove the brush
        this.lineChart.removeBrush();
        break;
      } case Designs.CONSISTENT: {
        // draw the selection differently
        this.lineChart.refreshBrushPosition();
      } case Designs.FIXED: {
        // trigger a reevaluation
        this.lineChart.reEvalBrush();
      } case Designs.LOCK: {
        // set the state of clip
        // then the filter for new data would be lower bounded to whatever is earlier
        // and when the brush is unselected, everything moves back to normal.
      }
    }

    this.setState(prevState => {
      let start = prevState.start + prevState.interval;
      if ((prevState.design === Designs.LOCK) && (this.lineChart.state.filter)) {
        // find the selected low
        start = Math.min(this.lineChart.state.filter.low, start);
      }
      return {
        start
      };
    });
    getNextData(this.state.start, this.state.start + this.state.interval);
  }

  changeDesign(e: any) {
    this.setState({design: e.target.value});
  }

  render() {
    // see if there are new data
    let newDataDisabled = false;
    if (this.state.maxTime < this.state.start + this.state.interval) {
      newDataDisabled = true;
    }
    return (<>
      <button onClick={this.newWindow} disabled={newDataDisabled}>New Data</button>
      <select
          value={this.state.design}
          onChange={this.changeDesign}
        >
        <option value={Designs.CONSISTENT}>Consistent</option>
        <option value={Designs.FIXED}>Fixed</option>
        <option value={Designs.LOCK}>Lock</option>
        <option value={Designs.REMOVE}>Remove</option>
      </select>
      <LineChart
        ref={l => this.lineChart = l}
        design={this.state.design}
      />
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