import * as React from "react";


import { db } from "../sql/setup";
import { Designs } from "../lib/helper";
import LineChart from "./LineChart";
import BarChart from "./Barchart";
import { aSeries, bSeries, chartAName, chartBName, chartScatterName, getNextData, setBarChartStateHelper, setLineChartStateHelper, setupDial } from "../sql/streaming/customSetup";

// refreshAllCharts

interface VisContainerProps {
  interval?: number;
}

interface VisContainerState {
  design: Designs;
  start: number;
  end: number;
  lockIntervalCount: number;
  maxTime: number;
}

export default class VisContainer extends React.Component<VisContainerProps, VisContainerState> {
  lineChart: LineChart;
  chartA: BarChart;
  chartB: BarChart;

  static defaultProps = {
    interval: 100
  };

  constructor(props: VisContainerProps) {
    super(props);
    this.refreshAllCharts = this.refreshAllCharts.bind(this);
    this.newWindow = this.newWindow.bind(this);
    this.changeDesign = this.changeDesign.bind(this);
    this.refreshAllCharts = this.refreshAllCharts.bind(this);
    this.clearLockInterval = this.clearLockInterval.bind(this);
    setupDial();
    let maxTime = db.exec(`select max(ts) from events`)[0].values[0][0] as number;
    this.state = {
      start: 0,
      end: props.interval,
      design: Designs.REMOVE,
      lockIntervalCount: 1,
      maxTime
    };
  }
  componentDidMount() {
    db.create_function("refreshAllCharts", this.refreshAllCharts);
    getNextData(this.state.start, this.props.interval);
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
    let { interval } = this.props;
    // get current
    // Note: need to update this logic if new data is actually coming
    // let maxTime = db.exec(`select max(ts) from events`)[0].values[0][0] as number;
    // case Designs.REMOVE: {
    //   // remove the brush
    //   break;
    // } case Designs.CONSISTENT: {
    //   // draw the selection differently
    //   this.lineChart.refreshBrushPosition();
    // } case Designs.: {
    //   // trigger a reevaluation
    // } case : {
    //   // set the state of clip
    //   // then the filter for new data would be lower bounded to whatever is earlier
    //   // and when the brush is unselected, everything moves back to normal.
    // }
    this.setState(prevState => {
      let start = prevState.start + interval / 2;
      let end = start + interval;
      if ((prevState.design === Designs.LOCK) && (this.lineChart.state.filter)) {
        // find the selected low
        start = Math.min(this.lineChart.state.filter.low, start);
        end = start + prevState.lockIntervalCount * interval;
      }
      console.log("new window!", prevState.start, start);
      return {
        start,
        end,
        lockIntervalCount: prevState.lockIntervalCount + 1
      };
    });
    getNextData(this.state.start, this.state.end);
    if (this.state.design !== Designs.FIXED) {
      this.lineChart.removeBrush();
    } else {
      this.lineChart.reEvalBrush();
    }
  }

  clearLockInterval() {
    this.setState({
      lockIntervalCount: 1
    });
  }

  changeDesign(e: any) {
    let idx = e.target.value as keyof typeof Designs;
    let design = Designs[idx];
    this.setState({design});
  }

  render() {
    // see if there are new data
    let newDataDisabled = false;
    if (this.state.maxTime < this.state.start + this.props.interval) {
      newDataDisabled = true;
    }
    return (<>
      <button onClick={this.newWindow} disabled={newDataDisabled}>New Data</button>
      <select
          value={Designs[this.state.design]}
          onChange={this.changeDesign}
        >
        <option value={Designs[Designs.CONSISTENT]}>Consistent</option>
        <option value={Designs[Designs.FIXED]}>Fixed</option>
        <option value={Designs[Designs.LOCK]}>Lock</option>
        <option value={Designs[Designs.REMOVE]}>Remove</option>
      </select>
      <LineChart
        ref={l => this.lineChart = l}
        design={this.state.design}
        clearLockInterval={this.clearLockInterval}
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