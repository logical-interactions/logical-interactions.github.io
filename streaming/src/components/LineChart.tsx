import * as React from "react";
import * as d3 from "d3";

import { db } from "../sql/setup";
import { brushItx } from "../sql/streaming/customSetup";
import { Datum } from "../lib/data";
import { Designs } from "../lib/helper";
import { SvgSpinner } from "./SvgSpinner";


interface LineChartProps {
  design: Designs;
  clearLockInterval: () => void;
  height?: number;
  spinnerRadius?: number;
  width?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  yDomain?: [number, number];
}

interface LineChartState {
  data: Datum[];
  pending: boolean;
  filter: {
    low: number;
    high: number;
    pixelLow: number;
    pixelHigh: number;
  };
}

export default class LineChart extends React.Component<LineChartProps, LineChartState> {
  // these brushing pattern is really ugly
  // think about better abstractions around these
  brushG: SVGGElement;
  brush: d3.BrushBehavior<{}>;
  x: d3.ScaleLinear<number, number>;
  static defaultProps = {
    colorOverride: false,
    height: 200,
    spinnerRadius: 20,
    marginBottom: 40,
    marginLeft: 45,
    marginRight: 20,
    marginTop: 20,
    width: 200,
    showLabel: false,
    showAxesLabels: true,
  };
  constructor(props: LineChartProps) {
    super(props);
    this.setLineChartPendingState = this.setLineChartPendingState.bind(this);
    this.updateBrushState = this.updateBrushState.bind(this);
    this.removeBrush = this.removeBrush.bind(this);
    this.state = {
      data: null,
      pending: false,
      filter: null,
    };
  }

  // componentDidMount() {
  //   db.create_function("setLineChartPendingState", this.setLineChartPendingState);
  //   db.create_function("setLineChartDataState", this.setLineChartDataState);
  // }

  setLineChartPendingState(pending: boolean) {
    this.setState({
      pending,
    });
  }

  setLineChartDataState(data: Datum[]) {
    // console.log("setting line chart state", data);
    this.setState({data});
  }

  removeBrush() {
    d3.select(this.brushG).call(this.brush.move, null);
  }

  // huge hack...
  refreshBrushPosition() {
    // also move the brush position
    d3.select(this.brushG).call(this.brush.move, [this.state.filter.low, this.state.filter.high].map(this.x));
  }

  reEvalBrush() {
    let low = this.x.invert(this.state.filter.pixelLow);
    let high = this.x.invert(this.state.filter.pixelHigh);
    this.setState((prevState) => {
      return {
        filter: {
          low,
          high,
          pixelLow: prevState.filter.pixelLow,
          pixelHigh: prevState.filter.pixelHigh
        }
      };
    });
    brushItx(low, high);
    console.log("re-evaluated brushed", low, high);
  }

  updateBrushState(isEmpty: boolean, low: number, high: number, pixelLow: number, pixelHigh: number) {
    if (isEmpty) {
      this.setState({filter: null});
    } else {
      this.setState({filter: {low, high, pixelHigh, pixelLow}});
    }
  }

  render() {
    let { width, height, marginLeft, marginRight, marginTop, marginBottom, spinnerRadius } = this.props;
    let { data, pending } = this.state;
    let spinner: JSX.Element = null;
    let vis: JSX.Element = null;

    if (pending) {
      spinner = <SvgSpinner
                  color={"#FFEA19"}
                  cx={width / 2}
                  radius={spinnerRadius}
                  cy={spinnerRadius}
                />;
    }

    const innerWidth = width - marginLeft - marginRight;
    const innerHeight = height - marginTop - marginBottom;

    if (data) {
      let y = d3.scaleLinear()
                .rangeRound([innerHeight, 0])
                .domain(d3.extent(data, (d) => d.y));
      let x = d3.scaleLinear()
                .rangeRound([0, innerWidth])
                .domain(d3.extent(data, (d) => d.x));
      this.x = x;
      let lineMapping = d3.line<Datum>().x((d) => x(d.x)).y((d) => y(d.y));
      let line = lineMapping(data);
      let brushedLine = null;
      if (this.state.filter && (this.props.design !== Designs.REMOVE)) {
        brushedLine = lineMapping(data.filter((d) => ((d.x < this.state.filter.high) && (d.x > this.state.filter.low))));
      }
      // this is kinda questionable
      let update = this.updateBrushState;
      let clearLockInterval = this.props.clearLockInterval;
      let brush = d3.brushX()
        .extent([[0, 0], [innerWidth, innerHeight]])
        .on("end", function() {
          // [[x0, y0]
          const s = d3.brushSelection(this) as [number, number];
          console.log("source event", d3.event.sourceEvent);
          if (s === null) {
            // only reset if it's user initated
            if ((d3.event.sourceEvent) && (d3.event.sourceEvent.type === "mouseup")) {
              brushItx(-1, -1);
              update(true, -1, -1, -1, -1);
              clearLockInterval();
            }
          } else {
            let sx = s.map(x.invert);
            console.log("brushed", d3.brushSelection(this), "mapped", sx);
            brushItx(sx[0], sx[1]);
            update(false, sx[0], sx[1], s[0], s[1]);
          }
        });

      this.brush = brush;

      vis = <g>
        <path stroke="steelblue" fill="none" stroke-wdith="1.5" d={line}></path>
        <path stroke="red" fill="none" stroke-wdith="1.5" d={brushedLine}></path>
        <g ref={ g => {
            this.brushG = g;
            // (window as any).brushG = g;
            // (window as any).brush = brush;
            d3.select(g).call(brush);
          } }></g>
        <g ref={(g) => d3.select(g).call(d3.axisLeft(y).ticks(5))}></g>
        <g ref={(g) => d3.select(g).call(d3.axisBottom(x).ticks(4))} transform={"translate(0," + innerHeight + ")"}></g>
        {spinner}
      </g>;
    }

    return (<svg  width={width} height={height + spinnerRadius * 3}>
      <g transform={"translate(" + marginLeft + "," + marginTop + ")"}>
        {vis}
      </g>
    </svg>);
  }
}