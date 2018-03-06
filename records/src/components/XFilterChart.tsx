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
  fill?: string;
  height?: number;
  width?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  yDomain?: [number, number];
}

const defaultProps = {
  colorOverride: false,
  fill: "rgb(255, 192, 203, 0.5)",
  height: 200,
  marginBottom: 40,
  marginLeft: 45,
  marginRight: 20,
  marginTop: 20,
  width: 300,
  showLabel: false,
  showAxesLabels: true,
};

export const XFilterChart = (props: XFilterChartProps) => {
  props = bindDefault(props, defaultProps);
  let { chart, width, height, fill, marginLeft, marginRight, marginTop, marginBottom, baseData, xFilterData, pending } = props;
  let stmts = getXFilterStmts();
  let spinner: JSX.Element = null;
  let vis: JSX.Element = null;
  if (pending) {
    spinner = <Indicator />;
  }
  const innerWidth = width - marginLeft - marginRight;
  const innerHeight = height - marginTop - marginBottom;
  let x = d3.scaleLinear()
            .rangeRound([0, innerWidth])
            .domain(baseData.map((d) => d.x));
  let bandwidth = innerWidth * 0.8 / baseData.length;
  let y = d3.scaleLinear()
            .rangeRound([innerHeight, 0])
            .domain([0, d3.max(baseData, (d) => d.y)]);
  // get y scale and x positioning
  // note that the concat order matters, due to svg z-index
  let bars = baseData.concat(xFilterData).map((d, i) => <rect x={x(d.x)} y={y(d.y)} width={bandwidth} height={innerHeight - y(d.y)} fill={fill}></rect>);
  vis = <svg  width={width} height={height}>
          {bars}
          <g ref={(g) => d3.select(g).call(d3.axisLeft(y).ticks(5, "d"))}></g>
          <g ref={(g) => d3.select(g).call(d3.axisBottom(x).ticks(4))} transform={"translate(0," + innerHeight + ")"}></g>
          {spinner}
        </svg>;

  let brush = d3.brushX()
                .extent([[0, 0], [innerWidth, innerHeight]])
                .on("start", function() {
                  // TODO
                })
                .on("end", function() {
                  const s = d3.brushSelection(this) as [number, number];
                  if (s !== null) {
                    stmts.insertBrushItx.run([+new Date(), x.invert(s[0]), x.invert(s[1]), chart]);
                  }
                });
  let brushDiv = <g ref={ g => d3.select(g).call(brush) }></g>;
  return(<>
    {vis}
    {brushDiv}
    {spinner}
  </>);
};