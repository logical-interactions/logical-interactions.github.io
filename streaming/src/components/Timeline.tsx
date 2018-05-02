import * as React from "react";
import * as d3 from "d3";

import { db } from "../sql/setup";
import { setWindow } from "../sql/streaming/customSetup";
import { getFormattedTime } from "../lib/helper";

interface TimelineProps {
  lineWidth?: number;
  height?: number;
  margin?: {left: number, right: number};
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
    lineWidth: 400,
    margin: {
      left: 50,
      right: 50
    }
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
    let { lineWidth, height, margin } = this.props;
    let x = d3.scaleLinear()
              .rangeRound([margin.left, margin.left + lineWidth])
              .domain([minTime, maxTime]);
    let brushSvg: JSX.Element = null;
    if (minWindow && maxWindow) {
      let brushStart = x(minWindow);
      let brushEnd = x(maxWindow);
      console.log("brush results", brushStart, brushEnd);
      let brush = d3.brushX()
          .extent([[0, 0], [lineWidth, height]])
          .on("start", () => {})
          .on("end", function() {
            // only if it's user initiated, otherwise we'are going in cycles again
            if ((d3.event.sourceEvent) && (d3.event.sourceEvent.type === "mouseup")) {
              const s = d3.brushSelection(this) as [number, number];
              if (s === null) {
                // let the automatic one take its course
              } else {
                let sx = s.map(x.invert);
                setWindow(sx[0], sx[1]);
              }
            }
          });
      brushSvg = <g><text x={brushStart} y={height} font-size="20">{getFormattedTime(minWindow)}</text>
      <text x={brushEnd} y={20} font-size="20">{getFormattedTime(maxWindow)}</text>
      <g ref={ g => {
          d3.select(g).call(brush);
          d3.select(g).call(brush.move, [brushStart, brushEnd]);
        }
      }></g>
      </g>;
    }
    let timeline = <svg width={lineWidth + margin.left + margin.right} height={height}>
      <text x="0" y={height} font-size="20">{minTime}</text>
      <line x1={margin.left} y1={height / 2} x2={lineWidth} y2={height / 2} stroke="gray" stroke-width="5"></line>
      <text x={margin.left + lineWidth + 10} y={height} font-size="20">{maxTime}</text>
      {brushSvg}
    </svg>;
    return timeline;
  }
}