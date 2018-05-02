import * as React from "react";
import * as d3 from "d3";

import { db } from "../sql/setup";

interface TimelineProps {
  width?: number;
  height?: number;
}

type timelineSelections =  {min: number, max: number}[];

interface TimelineState {
  // time bounds
  minTime: number;
  maxTime: number;
  minWindow: number;
  maxWindow: number;
  clipped: boolean;
  selections: timelineSelections;
}

export default class Timeline extends React.Component<TimelineProps, TimelineState> {
  static defaultProps = {
    height: 50,
    width: 300
  };
  constructor(props: TimelineProps) {
    super(props);
    this.setTimelineState = this.setTimelineState.bind(this);
    this.setTimelineSelections = this.setTimelineSelections.bind(this);
    this.setClipped = this.setClipped.bind(this);
    this.state = {
      minTime: 0,
      maxTime: 1,
      minWindow: 0,
      maxWindow: 1,
      clipped: false,
      selections: []
    };
  }

  setTimelineState(minTime: number, maxTime: number, minWindow: number, maxWindow: number) {
    this.setState({
      minTime,
      maxTime,
      minWindow,
      maxWindow,
    });
  }

  setTimelineSelections(selections: timelineSelections) {
    this.setState({
      selections
    });
  }

  setClipped(clipped: boolean) {
    this.setState({
      clipped
    });
  }

  render() {
    let { minTime, maxTime, minWindow, maxWindow } = this.state;
    let { width, height } = this.props;
    let brushStart = width * ((minWindow - minTime) / (maxTime - minTime));
    let brushEnd = width * ((maxWindow - minTime) / (maxTime - minTime));
    let brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on("start", () => {})
        .on("end", () => {});
    let timeline = <svg width={width + 20} height={height}>
      <line x1="10" y1={height / 2} x2={width} y2={height / 2} stroke="gray" stroke-width="5"></line>
      <g ref={ g => {
          d3.select(g).call(brush);
          d3.select(g).call(brush.move, [brushStart, brushEnd]);
        }
      }></g>
      {/* <g ref={ g => d3.select(g).call(brush.move, [brushStart, brushEnd]) }></g> */}
    </svg>;
    return timeline;
  }
}