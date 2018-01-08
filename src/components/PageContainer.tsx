import * as React from "react";

import MergedContainer from "./MergedContainer";
import Scatterplot from "./Scatterplot";
import ZoomContainer from "./ZoomContainer";
import CrossfilterContainer from "./CrossfilterContainer";
import { numberArray } from "../lib/stockData";
import { getScatterData, getFlightData } from "../lib/data";

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
    super(undefined);
    this.onChange = this.onChange.bind(this);
    this.state = {
      bufferSize: 4,
      encoding: "POSITION", // "COLOR"
      avgDelay: 2000,
      varDelay: 1000,
      ordered: true,
      disabled: false,
      color: "BLUE", // "MULTI"
    };
  }

  onChange(event: any) {
    // hack, if can be coerced into number, coerce into number
    let value = parseInt(event.target.value, 10);
    value = isNaN(value) ? event.target.value : value;
    this.setState({ [event.target.name]: value });
  }

  // onChange(event: any) {
  //   this.setState({event.target.id, event.target.value});
  // }
  render() {
    let intro = (<p>
      This page show cases the design of chronicles.
    </p>);
    let control = (
      <div className="controls">
        <label htmlFor="encoding">Design:  </label>
        <select id="encoding" name="encoding" className="select" value={this.state.encoding} onChange={this.onChange}>
          <option value="POSITION">Multiples</option>
          <option value="COLOR">Overlay</option>
        </select>
        <label htmlFor="encoding">  Buffer Size:  </label>
        <select id="bufferSize" name="bufferSize" className="select" value={this.state.bufferSize.toString()} onChange={this.onChange}>
          <option value="1">1</option>
          <option value="3">3</option>
          <option value="6">6</option>
          <option value="9">9</option>
          <option value="12">12</option>
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
    let moreDesignsScatter = (<p>
      Asynchronous designs could be applied to other scenarios that doesn't seem "parallelizable" immediately. See the following example of zooming on a scatter plot.
    </p>);
    let scatterData = getScatterData(numberArray);
    let scatter = (
      <ZoomContainer
        bufferSize={this.state.bufferSize}
        avgDelay={this.state.avgDelay}
        varDelay={this.state.varDelay}
        encoding={this.state.encoding}
        ordered={this.state.ordered}
        color={this.state.color}
        dataset={scatterData}
      />
    );
    let moreDesignsCrossfilter = (<p>
      Here is an example of crossfilter using chronicles.
    </p>);
    let crossfilterData = getFlightData();
    let crossfilter = (
      <CrossfilterContainer
        dataset={crossfilterData}
        avgDelay={this.state.avgDelay}
        varDelay={this.state.varDelay}
      />
    );
    return (
      <div>
        {intro}
        {control}
        {vis}
        {moreDesignsScatter}
        {scatter}
        {moreDesignsCrossfilter}
        {crossfilter}
      </div>
    );
  }
}