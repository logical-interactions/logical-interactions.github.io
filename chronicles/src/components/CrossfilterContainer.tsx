import * as d3 from "d3";
import * as React from "react";

import XChart from "./XChart";
import Indicator from "./Indicator";
import { filterFlightData, XFilterDatum, XFilterSelection } from "../lib/data";

interface CrossfilterContainerProps {
  dataset: XFilterDatum[];
  avgDelay: number;
  varDelay: number;
  fields?: string[];
  multipleHeight: number;
  multipleWidth: number;
}

interface CrossfilterContainerState {
  currentSelections: XFilterSelection;
  selections: XFilterSelection[];
  currentItxId: number;
  datasets: {[index: number]: { [index: string]: XFilterDatum[]}};
}

export default class CrossfilterContainer extends React.Component<CrossfilterContainerProps, CrossfilterContainerState> {
  static defaultProps = {
    fields: ["a", "b", "c"],
    multipleHeight: 60,
    multipleWidth: 60,
  };

  constructor() {
    super(undefined);
    this.updateSelection = this.updateSelection.bind(this);
    this.processResponse = this.processResponse.bind(this);
    this.deselect = this.deselect.bind(this);
    this.state = {
      currentSelections: {},
      selections: [],
      currentItxId: -1, // must be -1, some logical dependency here
      datasets: {}
    };
  }

  deselect(chart: string) {
    this.setState(prevState => {
      // copy
      let selection: XFilterSelection = Object.assign({},  prevState.currentSelections);
      return {
        currentSelections: selection
      };
    });
  }

  getNewData(s: XFilterSelection, currentItxId: number) {
    console.log("Processing selection", s);
    if (Object.keys(s).length === 0) {
      throw Error("selection must contain at least one valid filter");
    }
    filterFlightData(this.props.dataset, s, currentItxId, this.props.fields,
      this.props.avgDelay, this.props.varDelay)
    .then(this.processResponse);
  }

  updateSelection(chart: string, min: number, max: number) {
    console.log("updateSelection called", chart, min, max);
    this.setState((prevState) => {
      let selectionsNew = prevState.selections.slice();
      const currentItxId = prevState.currentItxId + 1;
      let selection: XFilterSelection = Object.assign({}, prevState.currentSelections);
      selection[chart] = [min, max];
      this.getNewData(selection, currentItxId);
      selectionsNew.push(selection);
      return {
        selections: selectionsNew,
        currentSelections: selection,
        currentItxId,
      };
    });
  }

  processResponse(response: any) {
    const {selection, data, key} = response;
    // update state
    this.setState(prevState => {
      const datasets = Object.assign({}, prevState.datasets);
      datasets[key] = data;
      console.log("current state datasets", datasets);
      return {
        datasets
      };
    });
  }

  render() {
    let { dataset, fields } = this.props;
    let { datasets } = this.state;
    // let fixedScaleSet: {[index: string]: [number, number]} = {};
    // the control charts have the most up to date values
    let controlCharts: JSX.Element[] = [];
    // if (this.state.selections.length === 0) {
    ["a", "b", "c"].forEach(e => {
      let chartData = dataset.map((d) => { return d[e]; });
      controlCharts.push(<XChart
      // take the slice of that value
      data={chartData}
      bins={10}
      id={-1} // so long as < 0
      chart={e}
      selectable={true}
      updateSelection={this.updateSelection}
      width={this.props.multipleWidth}
      height={this.props.multipleHeight}
      color={"green"}
      key={e}
      />);
    });
    let charts: JSX.Element[] = [];
    let bounds: XFilterSelection = {};
    fields.forEach(e => {
      let nums = dataset.map((d) => { return d[e]; });
      let min = d3.min(nums);
      let max = d3.max(nums);
      bounds[e] = [min, max];
    });
    let iMax = this.state.selections.length - 1;
    for (let i = iMax; i > -1; i --) {
      let element = this.state.selections[i];
      // create a set of charts
      let xfilterCharts: JSX.Element[] = [];
        fields.forEach(e => {
          let chartData;
          if (datasets[i]) {
            chartData = datasets[i][e].map((d) => { return d[e]; });
          }
          let selection: [number, number] = null;
          if (element[e]) {
            selection = [(element[e][0] - bounds[e][0]) / (bounds[e][1] - bounds[e][0]), (element[e][1] - bounds[e][0]) / (bounds[e][1] - bounds[e][0])];
          }
          xfilterCharts.push(<XChart
            // take the slice of that value
            data={chartData}
            bins={10}
            id={i}
            chart={e}
            selectable={false} // i === iMax ? true : false
            updateSelection={this.updateSelection}
            selection={selection}
            width={this.props.multipleWidth}
            height={this.props.multipleHeight}
            key={i.toString() + e}
            fixedScale={bounds[e]}
          />);
        });
        charts.push(<div key={"xfilter" + i}>{xfilterCharts}</div>);
    }

    return(<div>
      {controlCharts}
      {charts}
    </div>);
  }
}