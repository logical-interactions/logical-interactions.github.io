import * as React from "react";
import * as d3 from "d3";

import { Indicator } from "./Indicator";
import { db } from "../records/setup";
import { Datum } from "../lib/data";
import { bindDefault } from "../lib/helper";
import { getXFilterStmts } from "../records/XFilter/setup";

// slightly different from the original XFilterChart, since we need two layers

interface XFilterChartProps {
  baseData: {x: number, y: number}[];
  xFilterData: {x: number, y: number}[];
  pending: boolean;
  // doesn't quite work with chronicles yet
  chart: string;
  baseFill?: string;
  selectFill?: string;
  height?: number;
  width?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  yDomain?: [number, number];
  maxZoomScale?: number;
}

interface XFilterChartState {
  scale: number;
}

export default class XFilterChart extends React.Component<XFilterChartProps, XFilterChartState> {
  // bars: SVGGElement;
  // gX: SVGGElement;
  // gY: SVGGElement;

  static defaultProps = {
    colorOverride: false,
    baseFill: "rgb(255, 192, 203, 0.5)",
    selectFill: "rgb(176, 224, 230, 0.8)",
    height: 100,
    marginBottom: 40,
    marginLeft: 45,
    marginRight: 20,
    marginTop: 20,
    width: 200,
    showLabel: false,
    showAxesLabels: true,
    maxZoomScale: 20,
  };
  constructor(props: XFilterChartProps) {
    super(props);
    this.zoomed = this.zoomed.bind(this);
    this.state = {
      scale: 1,
    };
  }
  zoomed() {
    // console.log("zoom called, setting scale to ", d3.event.transform.k);
    this.setState({
      scale: d3.event.transform.k
    });
  }
// export const XFilterChart = (props: XFilterChartProps) => {
  // props = bindDefault(props, defaultProps);
  render() {
    let { chart, width, height, baseFill, marginLeft, marginRight, marginTop, marginBottom, baseData, xFilterData, pending, selectFill, maxZoomScale } = this.props;
    let { scale } = this.state;
    // console.log(`[XFilterChart] ${chart}`, baseData, xFilterData);
    let stmts = getXFilterStmts();
    let spinner: JSX.Element = null;
    let vis: JSX.Element = null;
    if (pending) {
      spinner = <Indicator />;
    }
    const innerWidth = width - marginLeft - marginRight;
    const innerHeight = height - marginTop - marginBottom;
    // must be before data is processed
    let bandwidth = innerWidth * 0.8 / baseData.length;
    // let renderData = baseData;
    // x should be set before.
    let x = d3.scaleLinear()
              .rangeRound([0, innerWidth])
              .domain([d3.min(baseData, (d) => d.x), d3.max(baseData, (d) => d.x)]);
    if (scale > 1) {
      // console.log("old data", baseData.length, baseData);
      let maxVal = d3.max(baseData, (d) => d.x);
      baseData = baseData.filter((d) => d.x < (maxVal / maxZoomScale * (maxZoomScale - scale + 1)));
      // console.log("new data", baseData.length, baseData);
    }
    let y = d3.scaleLinear()
              .rangeRound([innerHeight, 0 - innerHeight * (scale - 1)])
              .domain([0, d3.max(baseData, (d) => d.y)]);
    // get y scale and x positioning
    // let tX = x;
    // let tY = y;
    // if (transform) {
    //   tX = transform.rescaleX(x);
    //   tY = transform.rescaleX(y);
    // }
    let xAxis = d3.axisLeft(y).ticks(5, "d");
    let yAxis = d3.axisBottom(x).ticks(4);
    let baseBars = baseData.map((d, i) => <rect x={x(d.x)} y={y(d.y)} width={bandwidth} height={innerHeight - y(d.y)} fill={baseFill}></rect>);
    let selectBars = (xFilterData ? xFilterData : []).map((d, i) => <rect x={x(d.x)} y={y(d.y)} width={bandwidth} height={innerHeight - y(d.y)} fill={selectFill}></rect>);
    let brush = d3.brushX()
                  .extent([[0, 0], [innerWidth, innerHeight]])
                  .on("start", function() {
                    // TODO
                    console.log("brush started");
                  })
                  .on("end", function() {
                    const s = d3.brushSelection(this) as [number, number];
                    if (s !== null) {
                      let v1 = x.invert(s[0]);
                      let v2 = x.invert(s[1]);
                      stmts.insertBrushItx.run([+new Date(), Math.min(v1, v2), Math.max(v1, v2), chart]);
                    }
                  });
    let brushDiv = <g ref={ g => d3.select(g).call(brush) }></g>;
    vis = <svg width={width} height={height} ref={(g) => {d3.select(g).call(zoom); }}>
            <g  transform={`translate(${marginLeft}, ${marginTop})`} >
              {baseBars}
              {selectBars}
              <g ref={(g) => {d3.select(g).call(xAxis); }}></g>
              <g ref={(g) => { d3.select(g).call(yAxis); }} transform={"translate(0," + innerHeight + ")"}></g>
              {brushDiv}
              {spinner}
            </g>
          </svg>;
    let zoom = d3.zoom()
                 .scaleExtent([1, 10])
                 .translateExtent([[0, -100], [width, height]])
                 .on("zoom", this.zoomed);

    // console.log("brush", brushDiv);
    return(<div>
      {vis}
    </div>);
  }
}