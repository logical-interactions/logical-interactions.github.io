import * as React from "react";
import * as d3 from "d3";
import Scatterplot from "./Scatterplot";
import { Datum, getScatterData, filterZoomData } from "../lib/data";
import { Rect, rectToString } from "../lib/geometry";

interface ZoomContainerProps {
  avgDelay: number;
  varDelay: number;
  encoding: string;
  bufferSize: number;
  color: string;
  ordered: boolean;
  dataset: Datum[];
  // below are optional for multiples
  multipleHeight?: number;
  multipleWidth?: number;
}

interface ZoomContainerState {
  selections: Rect[];
  currentItxId: number;
  datasets: {[index: number]: Datum[]};
}

export default class ZoomContainer extends React.Component<ZoomContainerProps, ZoomContainerState> {
  static defaultProps = {
    multipleHeight: 100,
    multipleWidth: 100,
  };

  constructor() {
    super(undefined);
    this.updateSelection = this.updateSelection.bind(this);
    this.processResponse = this.processResponse.bind(this);
    this.state = {
      selections: [],
      currentItxId: -1, // must be -1, some logical dependency here
      datasets: {}
    };
  }

  updateSelection(selection: Rect) {
    console.log("updateSelection called", selection);
    this.setState((prevState) => {
      let selectionsNew = prevState.selections.slice();
      selectionsNew.push(selection);
      const currentItxId = prevState.currentItxId + 1;
      this.getNewData(selection, currentItxId);
      return {
        selections: selectionsNew,
        currentItxId,
      };
    });
  }
  processResponse(response: any) {
    const {selection, data, key} = response;
    console.log("Zoom data received", response);
    this.setState(prevState => {
      const datasets = Object.assign({}, prevState.datasets);
      datasets[key] = data;
      console.log("current state datasets", datasets);
      return {
        datasets
      };
    });
  }
  getNewData(s: Rect, currentItxId: number) {
    filterZoomData(this.props.dataset, s, currentItxId, this.props.avgDelay, this.props.varDelay)
    .then(this.processResponse);
  }

  render() {
    let original = (
      <Scatterplot
        dataset={this.props.dataset}
        selected={{x1: 0, y1: 0, x2: 0, y2: 0} }
        selectable={true}
        updateSelection={this.updateSelection}
      />
    );
    let scatterplots: JSX.Element[] = [];
    for (let i = 0; i < this.state.selections.length; i ++) {
      let s = this.state.selections[i];
      //       return new Promise((resolve, reject) => {
      //   let delay = getRandomInt(avgDelay - varDelay, avgDelay + varDelay);
      //   setTimeout(
      //     () => resolve({selection: selection, data, itxid}),
      //     delay
      //   );
      // });
      let data = this.state.datasets[i];
      console.log("new data for scatter", data, "with brush", s);
      scatterplots.push(
        <Scatterplot
          dataset={ data }
          selected={ s }
          selectable={ false }
          xDomain={[s.x1, s.x2]}
          yDomain={[s.y1, s.y2]}
          key={rectToString(s)}
        />
      );
    }
    return (<div>
      {original}
      {scatterplots}
    </div>);
  }
}