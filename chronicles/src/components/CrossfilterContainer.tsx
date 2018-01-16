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
}

interface CrossfilterContainerState {
  currentSelections: XFilterSelection;
  selections: XFilterSelection[];
  currentItxId: number;
  datasets: {[index: number]: XFilterDatum[]};
}

export default class CrossfilterContainer extends React.Component<CrossfilterContainerProps, CrossfilterContainerState> {
  static defaultProps = {
    fields: ["a", "b", "c"],
    multipleHeight: 100,
    multipleWidth: 100,
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
    filterFlightData(this.props.dataset, s, currentItxId, this.props.avgDelay, this.props.varDelay)
    .then(this.processResponse);
  }

  updateSelection(chart: string, min: number, max: number) {
    console.log("updateSelection called", chart, min, max);
    this.setState((prevState) => {
      let selectionsNew = prevState.selections.slice();
      // selectionsNew.push(selection);
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
      this.setState(prevState => {
        const datasets = Object.assign({}, prevState.datasets);
        datasets[key] = data;
        console.log("current state datasets", datasets);
        return {
          datasets
        };
      });
    });
  }

  render() {
    let { dataset, fields } = this.props;
    let { datasets } = this.state;

    // the control charts have the most up to date values
    let controlCharts: JSX.Element[] = [];
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
      color={"green"}
      key={e}
      />);
    });
    let charts: JSX.Element[] = [];
    // get the range for each input
    // i wonder if react is smart enough not to calc this again.
    // compute the bounds
    let bounds: XFilterSelection = {};
    fields.forEach(e => {
      let nums = dataset.map((d) => { return d[e]; });
      let min = d3.min(nums);
      let max = d3.max(nums);
      bounds[e] = [min, max];
    });
    // this.state.selections.forEach((element, i) => {
    for (let i = this.state.selections.length - 1; i > -1; i --) {
      let element = this.state.selections[i];
      // create a set of charts
      let xfilterCharts: JSX.Element[] = [];
      // if (datasets[i]) {
        fields.forEach(e => {
          let chartData;
          if (datasets[i]) {
            chartData = datasets[i].map((d) => { return d[e]; });
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
            selectable={false}
            selection={selection}
            key={i.toString() + e}
          />);
        });
        charts.push(<div key={"xfilter" + i}>{xfilterCharts}</div>);
      // } else {
      //   charts.push(<Indicator loading={true} key={i.toString() + "indicator"} />);
      // }
    }

    return(<div>
      {controlCharts}
      {charts}
    </div>);
  }
}