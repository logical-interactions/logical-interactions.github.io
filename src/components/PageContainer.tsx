import * as React from "react";
import * as seedrandom from "seedrandom";

import MergedContainer from "./MergedContainer";
// import { Encoding, Widget, Events } from "../lib/chronicles";

interface PageContainerState {
  bufferSize: number;
  avgDelay: number;
  varDelay: number;
  encoding: string;
  ordered: boolean;
  color: string;
  disabled: boolean;
}

export default class PageContainer extends React.Component<undefined, PageContainerState> {
  constructor() {
    super();
    this.state = {
      bufferSize: 4,
      encoding: "POSITION", // "COLOR"
      avgDelay: 2000,
      varDelay: 1000,
      ordered: true,
      disabled: false,
      color: "BLUE", // "MULTI"
    };
  };

  onChange(event: any) {
    this.setState(event.target.id, event.target.value);
  }
  render() {
    let intro = (<p>

    </p>);
    let control = (
      // TODO: some buttons
      <div>
        <label htmlFor="blocking">Design</label>
        <select id="encoding" name="encoding" value={this.state.encoding} onChange={this.onChange}>
          <option value="POSITION">Multiples</option>
          <option value="COLOR">Overlay</option>
        </select>
      </div>
    );
    let vis = (
      <MergedContainer
        bufferSize={this.state.bufferSize}
        avgDelay={this.state.avgDelay}
        varDelay={this.state.varDelay}
        encoding={this.state.encoding}
        ordered={this.state.ordered}
        color={this.state.color}
        disabled={this.state.disabled}
      />);
    return (
      <div>
        {intro}
        {vis}
      </div>
    );
  }
}