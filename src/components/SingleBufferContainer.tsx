import * as React from "react";

import Chart from "./Chart";
import WidgetFacet from "./WidgetFacet";
import { Events, ColorScales } from "../lib/chronicles";
import { Datum, getData } from "../lib/data";

interface Results {
  selection: string;
  data: Datum[];
}

interface SingleBufferContainerProps {
  // "blocking", "async", "newest"
  // DO NOT support newer only
  policy: string;
  invalidate: boolean;
  avgDelay?: number;
  varDelay?: number;
}

interface SingleBufferContainerState {
  selected: string[];
  datasets: Results[];
  disabled: boolean;
}

export default class SingleBufferContainer extends React.Component<SingleBufferContainerProps, SingleBufferContainerState> {
  _isMounted: boolean;

  static defaultProps = {
    avgDelay: 2000,
    varDelay: 1000,
  };

  constructor() {
    super(undefined);
    this.processResponse = this.processResponse.bind(this);
    this.updateSelection = this.updateSelection.bind(this);
    this.state = {
      selected: [],
      datasets: [],
      disabled: false,
    };
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  processResponse(response: any) {
    if (this._isMounted) {
      const {selection, data, itxid} = response;
      this.setState(prevState => {
        const datasets = prevState.datasets.slice();
        datasets.push({selection, data});
        let disabled = false;
        return { datasets, disabled };
      });
    }
  }

  updateSelection(selection: string) {
    if (this.state.disabled) {
      return;
    }
    getData(selection, this.props.avgDelay, this.props.varDelay, 0)
      .then(this.processResponse);
    this.setState(prevState => {
      const selected = prevState.selected.slice();
      selected.push(selection);
      let disabled = false;
      if (this.props.policy === "blocking") {
        disabled = true;
      }
      return { selected, disabled };
    });
  }

  getDataOrNull(d: Results) {
    if (d === undefined) {
      return null;
    }
    return d.data;
  }

  getSelectionOrNull(d: Results) {
    if (d === undefined) {
      return null;
    }
    return d.selection;
  }
  render() {
    let { policy, invalidate } = this.props;
    let { selected, datasets } = this.state;
    // overloading chart with a single value
    // process chartDatasets as the policy

    let chartDatasets: { [index: string]: Datum[] } = {};
    let chartSelected: string = null; // process based on selected
    let colorScale = ColorScales["BLUE"](1);
    let chartData: Datum[];
    if (selected.length > 0) {
      if (policy === "blocking") {
        if (invalidate) {
          chartSelected = selected[selected.length - 1];
          chartData = this.getDataOrNull(datasets.filter((d) => { return d.selection === chartSelected; })[0]);
        } else {
          // chart datasets is what ever was there before...
          chartData = this.getDataOrNull(datasets[datasets.length - 1]);
          chartSelected = this.getSelectionOrNull(datasets[datasets.length - 1]);
        }
      } else if (policy === "async") {
        // show whatever is the newest data, and newest selection
        // might not match
        chartData =  this.getDataOrNull(datasets[datasets.length - 1]);
        chartSelected = selected[selected.length - 1];
      } else if (policy === "newest") {
        chartSelected = selected[selected.length - 1];
        // this emulates caching...
        chartData =  this.getDataOrNull(datasets.filter((d) => { return d.selection === chartSelected; })[0]);
      } else {
        throw Error("policy unspecified");
      }
      chartDatasets[chartSelected] = chartData;
    }
    let chart = <Chart
      bufferSize={1}
      datasets={chartDatasets}
      selected={[chartSelected]}
      xDomain={[2008, 2012] /* hardcoded */}
      yDomain={[0, 100] /* hardcoded */}
      colorScale={colorScale}
    />;
    let widget = <WidgetFacet
      bufferSize={1}
      facets={["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]}
      datasets={chartDatasets}
      selected={[chartSelected]}
      updateSelection={this.updateSelection}
      colorScale={colorScale}
    />;
    return(<div>
      {widget}
      {chart}
    </div>);
  }
}