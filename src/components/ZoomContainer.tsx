import * as React from "react";
import * as d3 from "d3";
import Scatterplot from "./Scatterplot";
import { Datum, getScatterData, filterZoomData } from "../lib/data";
import { Rect } from "../lib/geometry";

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
}

export default class ZoomContainer extends React.Component<ZoomContainerProps, ZoomContainerState> {
  static defaultProps = {
    multipleHeight: 100,
    multipleWidth: 100,
  };

  constructor() {
    super(undefined);
    this.updateSelection = this.updateSelection.bind(this);
    this.state = {
      selections: [],
      currentItxId: 0,
    };
  }

  updateSelection(selection: Rect) {
    this.setState((prevState) => {
      let selectionsNew = prevState.selections.slice();
      selectionsNew.push(selection);
      return {
        selections: selectionsNew,
        currentItxId: prevState.currentItxId + 1,
      };
    });
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
      let data = filterZoomData(this.props.dataset, s);
      scatterplots.push(
        <Scatterplot
          dataset={ data }
          selected={ s }
          selectable={ false }
        />
      );
    }
    return (<div>
      {original}
      {scatterplots}
    </div>);
  }
}