import * as React from "react";

// basically a wrapper around chart
// emulate the error bars getting smaller.

import MergedContainer from "./MergedContainer";
import { Datum, getData } from "../lib/data";

interface ProgessiveProps {
  bufferSize: number;
  avgDelay: number;
  varDelay: number;
}

interface ProgessiveState {

}

export default class Progessive extends React.Component<ProgessiveProps, ProgessiveState> {
  render() {
    return (
      <MergedContainer
        bufferSize={this.props.bufferSize}
        avgDelay={this.props.avgDelay}
        varDelay={this.props.varDelay}
        encoding={"POSITION"}
        ordered={true}
        color={"BLUE"}
        disabled={false}
        naiveImplementation={true}
        label={true}
      />);
  }
}