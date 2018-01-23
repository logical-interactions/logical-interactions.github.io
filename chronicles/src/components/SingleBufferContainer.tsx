import * as React from "react";

import Chart from "./Chart";
import WidgetFacet from "./WidgetFacet";
import EventsIllustration from "./EventsIllustration";
import { ColorScales } from "../lib/chronicles";
import { Datum, getData } from "../lib/data";
import { EventLog, Events } from "../lib/illustration";

interface Results {
  selection: string;
  data: Datum[];
  itxid: number;
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
  events: EventLog[];
  selected: string[];
  datasets: Results[];
  disabled: boolean;
  currentSelected: string;
  currentDataset: Results;
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
    this.renderLog = this.renderLog.bind(this);
    this.clearEvents = this.clearEvents.bind(this);
    this.state = {
      events: [],
      selected: [],
      datasets: [],
      disabled: false,
      currentSelected: null,
      currentDataset: null,
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
        let newD = {selection, data, itxid};
        datasets.push(newD);
        let disabled = false;
        let currentDataset: Results = Object.assign({}, prevState.currentDataset);
        let events = prevState.events.slice();
        let e = {
          event: Events.render,
          selection: selection,
          itxid,
          ts: Date.now()
        };
        switch (this.props.policy) {
          case "async":
            currentDataset = newD;
            break;
          default:
            if (selection !== prevState.currentSelected) {
              e.event = Events.discard;
              if (this.props.invalidate) {
                currentDataset = null;
              } // else no change
            } else {
              currentDataset = newD;
            }
            break;
        }
        events.push(e);
        return { datasets, disabled, currentDataset, events };
      });
      // console.log("Received response", data);
    }
  }

  updateSelection(selection: string) {
    if (this.state.disabled) {
      this.setState(prevState => {
        let events = prevState.events.slice();
        events.push({
          event: Events.blocked,
          selection: selection,
          itxid: null,
          ts: Date.now()
        });
        return {events};
      });
      return;
    }
    getData(selection, this.props.avgDelay, this.props.varDelay, this.state.selected.length)
      .then(this.processResponse);
    this.setState(prevState => {
      let selected = prevState.selected.slice();
      selected.push(selection);
      let events = prevState.events.slice();
      events.push({
        event: Events.interaction,
        selection: selection,
        itxid: selected.length - 1,
        ts: Date.now()
      });
      // console.log("selected", selection);
      let disabled = false;
      if (this.props.policy === "blocking") {
        disabled = true;
      }
      return { selected, disabled, events, currentSelected: selection };
    });
  }

  clearEvents() {
    this.setState({
      events: []
    });
  }


  getDataOrNull(d: Results) {
    if ((d === undefined) || (d === null)) {
      return null;
    }
    return d.data;
  }

  getSelectionOrNull(d: Results) {
    if (d === undefined || (d === null)) {
      return null;
    }
    return d.selection;
  }

  renderLog(itxid: number, selection: string) {
    this.setState(prevState => {
      let events = prevState.events.slice();
      events.push({
        event: Events.render,
        selection,
        itxid,
        ts: Date.now()
      });
      return { events };
    });
  }
  render() {
    let { policy, invalidate } = this.props;
    let { selected, datasets } = this.state;
    // overloading chart with a single value
    // process chartDatasets as the policy
    let chartDatasets: { [index: string]: Datum[] } = {};
    // let chartSelected: string = null; // process based on selected
    let colorScale = ColorScales["BLUE"](1);
    // let chartData: Results;
    let indicatorOn = false;
    if (selected.length > 0) {
    //   chartSelected = selected[selected.length - 1];
    //   if (policy === "blocking") {
    //     if (invalidate) {
    //       chartData = datasets.filter((d) => { return d.selection === chartSelected; })[0];

    //     } else {
    //       // chart datasets is what ever was there before...
    //       chartData = datasets[datasets.length - 1];
    //       // chartSelected = this.getSelectionOrNull(datasets[datasets.length - 1]);
    //     }
    //   } else if (policy === "async") {
    //     // show whatever is the newest data, and newest selection
    //     // might not match
    //     chartData =  datasets[datasets.length - 1];
    //   } else if (policy === "newest") {
    //     // this emulates caching...
    //     chartData =  datasets.filter((d) => { return d.selection === chartSelected; })[0];
    //   } else {
    //     throw Error("policy unspecified");
    //   }
      chartDatasets[this.state.currentSelected] = this.getDataOrNull(this.state.currentDataset);
      let actualSelected = this.getSelectionOrNull(this.state.currentDataset);
      if ((actualSelected !== this.state.currentSelected) && (policy !== "async")) {
        indicatorOn = true;
      } else if ((policy === "async") && (datasets.length < selected.length)) {
        indicatorOn = true;
      }
    //   if (chartData) {
    //     this.renderLog(chartData.itxid, chartSelected);
    //   }
    }
    let chart = <Chart
      bufferSize={1}
      datasets={chartDatasets}
      selected={[this.state.currentSelected]}
      xDomain={[2008, 2012] /* hardcoded */}
      yDomain={[0, 100] /* hardcoded */}
      colorScale={colorScale}
      indicatorOn={indicatorOn}
    />;
    let widget = <WidgetFacet
      bufferSize={1}
      facets={["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]}
      datasets={chartDatasets}
      selected={[this.state.currentSelected]}
      updateSelection={this.updateSelection}
      colorScale={colorScale}
    />;
    let illustration = <EventsIllustration
      events={this.state.events.filter((e) => {return e.itxid !== 0; })}
      design={this.props.policy}
    />;
    let clearBtn = <button onClick={this.clearEvents}>clear events</button>;
    let grayout = "";
    if (this.state.disabled) {
      grayout = " gray-out";
    }
    return(<div className="clearfix">
      <div className="left">
      {widget}
      {chart}
      </div>
      <div className={"left " + grayout}>
      {illustration}
      {clearBtn}
      </div>
    </div>);
  }
}