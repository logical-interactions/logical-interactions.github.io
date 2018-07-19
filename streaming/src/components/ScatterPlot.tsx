import * as React from "react";
import * as d3 from "d3";

import { db } from "../sql/setup";
import { scatterBrushItx, removeBrush, brushStartItx, brushEndItx } from "../sql/streaming/customSetup";
import { Datum } from "../lib/data";
import { getFormattedTime, SelectionDesign } from "../lib/helper";
import { SvgSpinner } from "./SvgSpinner";


interface ScatterPlotProps {
  label: string;
  height?: number;
  spinnerRadius?: number;
  width?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  yDomain?: [number, number];
}

interface ScatterPlotState {
  data: Datum[];
  xlow: number;
  ylow: number;
  xhigh: number;
  yhigh: number;
}

export default class ScatterPlot extends React.Component<ScatterPlotProps, ScatterPlotState> {
  // these brushing pattern is really ugly
  // think about better abstractions around these
  brushG: SVGGElement;
  brush: d3.BrushBehavior<{}>;
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleLinear<number, number>;
  static defaultProps = {
    colorOverride: false,
    height: 200,
    spinnerRadius: 20,
    marginBottom: 40,
    marginLeft: 50,
    marginRight: 50,
    marginTop: 20,
    width: 600,
  };
  constructor(props: ScatterPlotProps) {
    super(props);
    this.removeBrushPixels = this.removeBrushPixels.bind(this);
    this.state = {
      data: null,
      xlow: null,
      ylow: null,
      xhigh: null,
      yhigh: null
    };
  }
  componentDidMount() {
    db.create_function("removeBrushPixels", this.removeBrushPixels);
  }

  setScatterPlotDataState(data: Datum[]) {
    // console.log("setting scatter plot state", data);
    this.setState({data});
  }

  setScatterPlotFilter(xlow: number, ylow: number, xhigh: number, yhigh: number) {
    // console.log(`Setting the filter low and highs`, low, high);
    this.setState({xlow, ylow, xhigh, yhigh});
    // here, make 2 different filters for the two possibilities of selection:
    // 1: scale selection; the filter should preserve the brushed field; any data points
    //    that fall within it at any point in time are the selected points
    // 2: data selection; the filter should preserve only the data points within the 
    //    brushed field at the time the brush is released
    //bounding box (xlow, ylow, xhigh, yhigh)
    //filter on timestamp -- immutable, changes in data points represented by different time stamps
  }

  removeBrushPixels() {
    // if the last interaction was a fixed one, do NOT remove
    // let r = db.exec(`select itxFixType from currentUserBrush`);
    // if ((r.length > 0) && r[0].values && (r[0].values[0][0] === "data")) {
    d3.select(this.brushG).call(this.brush.move, null);
    // }
  }


  render() {
    let { width, height, marginLeft, marginRight, marginTop, marginBottom, spinnerRadius } = this.props;
    let { data } = this.state;
    let spinner: JSX.Element = null;
    let vis: JSX.Element = null;

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
      this.y = y;
      let points = data.map((d) => <circle cx={d.x ? d.x : 0} cy={d.y ? d.y : 0} r="10" fill="steelblue"></circle>);
      let brushedRegion = null;
      let brushedData = null;
      if (this.state.xlow && this.state.ylow && this.state.xhigh && this.state.yhigh) {
        //MAKE A FILTER THAT ONLY KEEPS DATA POINTS BETWEEN THE LOW AND HIGH XS AT THE TIME OF BRUSH RELEASE
        brushedData = data.filter((d) => ((d.x > this.state.xlow) && (d.x < this.state.xhigh) && (d.y > this.state.ylow) && (d.y < this.state.yhigh)));
        brushedRegion = brushedData.map((d) => <circle cx={d.x ? d.x : 0} cy={d.y ? d.y : 0} r="10" fill="red"></circle>);
        //brushedRegion = lineMapping(data.filter((d) => ((d.x < this.state.high) && (d.x > this.state.low))));
      }
      let removeBrushPixelsAlias = this.removeBrushPixels;
      // let update = this.updateBrushState;
      // let clearLockInterval = this.props.clearLockInterval;
      let brush = d3.brush()
        .extent([[0, 0], [innerWidth, innerHeight]])
        .on("start", function() {
          // say that the brush has started, and the data should NOT render
          if ((d3.event.sourceEvent) && (d3.event.sourceEvent.type === "mousedown")) {
            brushStartItx();
          }
        })
        .on("end", function() {
          let itxFixType = "data";
          if ((d3.event.sourceEvent) && (d3.event.sourceEvent.type === "mouseup")) {
            if ((window.event as KeyboardEvent).shiftKey) {
              itxFixType = "scale";
            }
            brushEndItx();
          }
          // [[x0, y0]
          const s = d3.brushSelection(this) as [[number, number],[number, number]];
          console.log("source event", d3.event.sourceEvent);
          if (s === null) {
            // only reset if it's user initated
            if ((d3.event.sourceEvent) && (d3.event.sourceEvent.type === "mouseup")) {
              removeBrush();
            }
          } else {
            // console.log("brushed", d3.brushSelection(this), "mapped", sx);
            scatterBrushItx(x.invert(s[0][0]), y.invert(s[0][1]), x.invert(s[1][0]), y.invert(s[1][1]), itxFixType);
          }
        });

      this.brush = brush;

      vis = <g>
        {/* <path stroke="steelblue" fill="none" stroke-wdith="1.5" d="{points}"></path>
        <path stroke="red" fill="none" stroke-wdith="1.5" d="{brushedRegion}"></path>  */}
        {points}
        <g ref={ g => {
            this.brushG = g;
            // (window as any).brushG = g;
            // (window as any).brush = brush;
            d3.select(g).call(brush);
          } }></g>
        <g ref={(g) => d3.select(g).call(d3.axisLeft(y).ticks(5))}></g>
        <g ref={(g) => d3.select(g).call(
                           d3.axisBottom(x)
                             .ticks(4)
                             .tickFormat(getFormattedTime))
                             .selectAll("text")
                               .attr("transform", "rotate(-35)")
                               .style("text-anchor", "end")
                               .attr("dx", "-.8em")
                               .attr("dy", ".15em")
                } transform={"translate(0," + innerHeight + ")"}></g>
        {spinner}
      </g>;
    }

    return (<svg  width={width} height={height + spinnerRadius * 4  }>
      <g transform={"translate(" + marginLeft + "," + marginTop + ")"}>
        {vis}
      </g>
    </svg>);
  }
}