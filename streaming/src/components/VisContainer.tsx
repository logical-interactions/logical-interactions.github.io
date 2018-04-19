import * as React from "react";


import { db } from "../sql/setup";
import LineChart from "./LineChart";
import BarChart from "./Barchart";
import { aSeries, bSeries, chartAName, chartBName, chartScatterName, setBarChartStateHelper, setLineChartStateHelper } from "../sql/streaming/customSetup";

// refreshAllCharts

interface VisContainerState {

}

export default class VisContainer extends React.Component<undefined, VisContainerState> {
  lineChart: LineChart;
  chartA: BarChart;
  chartB: BarChart;

  constructor(props: undefined) {
    super(props);
    this.refreshAllCharts = this.refreshAllCharts.bind(this);
    this.state = {
      data: null,
      pending: false,
    };
  }
  componentDidMount() {
    db.create_function("refreshAllCharts", this.refreshAllCharts);
  }
  refreshAllCharts() {
    setLineChartStateHelper("chartTimeData", this.lineChart);
    setBarChartStateHelper("chartAData", this.chartA);
    setBarChartStateHelper("chartBData", this.chartB);
  }
  render() {
    return (<>
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