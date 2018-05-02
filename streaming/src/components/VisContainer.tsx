import * as React from "react";


import { db } from "../sql/setup";
import { SelectionDesign } from "../lib/helper";
import LineChart from "./LineChart";
import BarChart from "./Barchart";
import Timeline from "./Timeline";
import TableView from "./TableView";

import { aSeries, bSeries, chartAName, chartBName, chartScatterName, setWindow, setBarChartStateHelper, setLineChartStateHelper, setTimelineStateHelper, setTableViewHelper, setupDial } from "../sql/streaming/customSetup";

interface VisContainerProps {
  interval?: number;
}

interface VisContainerState {
  design: SelectionDesign;
  start: number;
  end: number;
  // maxTime: number;
}

export default class VisContainer extends React.Component<VisContainerProps, VisContainerState> {
  lineChart: LineChart;
  chartA: BarChart;
  chartB: BarChart;
  timeline: Timeline;
  tableView: TableView;

  static defaultProps = {
    interval: 100
  };

  constructor(props: VisContainerProps) {
    super(props);
    this.refreshAllCharts = this.refreshAllCharts.bind(this);
    // this.newWindow = this.newWindow.bind(this);
    this.changeDesign = this.changeDesign.bind(this);
    this.refreshAllCharts = this.refreshAllCharts.bind(this);

    // let maxTime = db.exec(`select max(ts) from events`)[0].values[0][0] as number;
    this.state = {
      start: 0,
      end: props.interval,
      design: SelectionDesign.data,
      // maxTime,
    };
  }
  componentDidMount() {
    db.create_function("refreshAllCharts", this.refreshAllCharts);
    setupDial();
    // setWindow(this.state.start, this.props.interval);
  }

  refreshAllCharts() {
    setLineChartStateHelper(this.lineChart);
    setBarChartStateHelper("chartAData", this.chartA);
    setBarChartStateHelper("chartBData", this.chartB);
    setTimelineStateHelper(this.timeline);
    setTableViewHelper(this.tableView);
  }

  // newWindow() {
  //   let { interval } = this.props;
  //   this.setState(prevState => {
  //     let start = prevState.start + interval / 2;
  //     let end = start + interval;
  //     console.log("new window!", start, end);
  //     setWindow(start, end);
  //     return {
  //       start,
  //       end,
  //     };
  //   });
  //   this.lineChart.removeBrush();
  // }


  changeDesign(e: any) {
    let idx = e.target.value as keyof typeof SelectionDesign;
    let design = SelectionDesign[idx];
    this.setState({design});
    db.run(`insert into table itxPolicy (val) values (${idx});`);
  }

  render() {
    // see if there are new data
    let newDataDisabled = false;
    // if (this.state.maxTime < this.state.start + this.props.interval) {
    //   newDataDisabled = true;
    // }
    return (<>
      {/* <button onClick={this.newWindow} disabled={newDataDisabled}>New Data</button> */}

      <LineChart
        ref={l => this.lineChart = l}
        design={this.state.design}
        label={"Sales"}
        // clearLockInterval={this.clearLockInterval}
      />
      <BarChart
        ref={b => this.chartA = b}
        chartName={chartAName}
        series={aSeries}
        label={"Location Distribution"}
      />
      <BarChart
        ref={b => this.chartB = b}
        chartName={chartBName}
        series={bSeries}
        label={"Gender Distribution"}
      />
      <Timeline
        ref={t => this.timeline = t}
      />
      <TableView
        ref={t => this.tableView = t}
        headers={["time", "sales", "id", "demographic", "gender"]}
      />
    </>);
  }
}