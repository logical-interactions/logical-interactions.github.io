import * as React from "react";


import { db,d } from "../sql/setup";
import { SelectionDesign } from "../lib/helper";
import LineChart from "./LineChart";
import BarChart from "./Barchart";
import Timeline from "./Timeline";
import TableView from "./TableView";
import ScatterPlot from "./ScatterPlot";

import { aSeries, bSeries, chartAName, chartBName, chartScatterName, setWindow, setBarChartStateHelper, setLineChartStateHelper, setTimelineStateHelper, setScatterPlotStateHelper, setTableViewHelper, setupDial } from "../sql/streaming/customSetup";

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
  scatterPlot: ScatterPlot;

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
    setScatterPlotStateHelper(this.scatterPlot)
    
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
    // let r = db.exec(`select * from filteredScatterDataView`);
    // see if there are new data
    let newDataDisabled = false;
    // if (this.state.maxTime < this.state.start + this.props.interval) {
    //   newDataDisabled = true;
    // }
    return (<>
      {/* <button onClick={this.newWindow} disabled={newDataDisabled}>New Data</button> */}
      <h1>
        Interaction on Quicksand
      </h1>
      <p>
        Directly brushing on streaming data is confusing.  We have created a few different types of brushes to help stablizing visual representations in streaming data analytics.  They are instrumented on the <b>line chart</b>.  In addition to the selections on the line chart, you can also brush on the timeline to select a specific region of time, which will also update the chart data in the linechart.
      </p>
      <p>
        The data is randomly generated on the client. It emulates monitoring "sales" data.  For each new "sales" event, the sum of the prices of items sold per minute is aggregated in the linechart, and the bar charts show the distribution of the attributes associated with these sales events.
      </p>
      <h2>
        Brush: "Scale Section"
      </h2>
      <p>
        Here, brushing the data will only select the period of time, and as the scale slides left due to streaming data, the selected region will slowly disappear.
      </p>
      <h2>
        Shift-Brush: "Clipped Scale Selection"
      </h2>
      <p>
        The clip selection is fixed to the chart, and forces the charts to reactively update when there are new data that falls into the selected region. This interaction is good for monitoring, if for any reason the existing streaming interaction is not set up to your liking.
      </p>
      <p>
        The clip brushed region will also show up as a brush in the line chart, which can give a visual hint about where in time you are compared to the most recent point in the data stream.
      </p>
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
      <ScatterPlot
        ref={s => this.scatterPlot = s}
        label={"Scatter Plot"}
        />
      {/* <ul>
        <li>{r}</li>
      </ul> */}
    </>);
  }
}