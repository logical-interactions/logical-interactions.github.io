import * as d3 from "d3";
import * as React from "react";

import {Rect, Datum} from "../lib/data";
import { bindDefault } from "../lib/helper";

export function rectToString(selected: Rect) {
  return selected.x1.toString() + selected.x2.toString() + selected.y1.toString() + selected.y2.toString();
}

interface ScatterplotProps {
  dataset: Datum[];
  selected: Rect;
  selectable: boolean;
  updateSelection? (selection: Rect): void;
  color?: string;
  height?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  width?: number;
  xDomain?: [number, number];
  yDomain?: [number, number];
  showLabel?: boolean;
  showAxesLabels?: boolean;
  annotationSize?: number;
}

const defaultProps = {
  color: "blue",
  height: 200,
  marginBottom: 40,
  marginLeft: 100,
  marginRight: 20,
  marginTop: 20,
  width: 300,
  annotationSize: 50,
  showLabel: false,
  showAxesLabels: true,
};

/**
 * Represents an SVG chart. The chart uses the selected data from props to
 * render the appropriate path(s). d3 is used to generate axes and scales.
 */
export const Scatterplot = (props: ScatterplotProps) => {
    props = bindDefault(props, defaultProps);
    const { dataset, selected, height, marginBottom, annotationSize,
            marginLeft, marginRight, marginTop, width, color, updateSelection } = props;
    let { xDomain, yDomain } = props;
    const innerWidth = width - marginLeft - marginRight;
    const innerHeight = height - marginTop - marginBottom;
    // set the scales
    if (!xDomain) {
      xDomain = [
        d3.min(dataset.map(d => d.x)),
        d3.max(dataset.map(d => d.x))
      ];
    }
    if (!yDomain) {
      yDomain = [
        d3.min(dataset.map(d => d.y)),
        d3.max(dataset.map(d => d.y))
      ];
    }
    const x = d3.scaleLinear()
                .domain(xDomain)
                .rangeRound([0, innerWidth]);
    const y = d3.scaleLinear()
                .domain(yDomain)
                .rangeRound([innerHeight, 0]);

    // construct the axes
    const axisBottom = d3.axisBottom(x)
                        .ticks(3, "d");
    const axisLeft = d3.axisLeft(y)
                      .ticks(10);

    let sId = rectToString(selected);

    const c = color;

    let label;
    if (this.props.showLabel) {
      label = (
        <rect
          className="chart-label"
          x={selected.x1}
          y={selected.y1}
          width={selected.x2 - selected.x1}
          height={selected.y2 - selected.y1}
          fill={"red"}
          fill-opacity="0.4"
        >
        </rect>
      );
    }

    let axesLabels;
    if (this.props.showAxesLabels) {
      axesLabels = (
        <g>
          <text
            className="chart-label"
            y={height - 5}
            x={(innerWidth / 2) + marginLeft}
            textAnchor="middle"
          >
            x
          </text>
          <text
            className="chart-label"
            x={-(innerHeight / 2) - marginTop}
            y={15 + 60}
            transform="rotate(-90)"
            textAnchor="middle"
          >
            y
          </text>
        </g>
      );
    }
    let brush: any;
    let brushLegend: any = null;
    // generate a brush that interacts with the chart
    let brushDiv: JSX.Element = null;
    let annotation: JSX.Element = null;
    if (this.props.selectable) {
      brush = d3.brush()
      .extent([[0, 0], [innerWidth, innerHeight]])
      .on("end", function() {
        // [[x0, y0], [x1, y1]],
        const s = d3.brushSelection(this) as [[number, number], [number, number]];
        if (s !== null) {
          let x1 = Math.min(x.invert(s[0][0]), x.invert(s[1][0]));
          let x2 = Math.max(x.invert(s[0][0]), x.invert(s[1][0]));
          let y1 = Math.min(y.invert(s[1][1]), y.invert(s[0][1]));
          let y2 = Math.max(y.invert(s[1][1]), y.invert(s[0][1]));
          let r = {x1: x1, y1: y1, x2: x2, y2: y2} as Rect;
          updateSelection(r);
          console.log("brushed", d3.brushSelection(this), "mapped", r);
        }
      });
      brushDiv = <g ref={ g => d3.select(g).call(brush) }></g>;
    } else {
      // this is a result component
      // need to basically create a smaller version of the brush and the original box
      // hard code 100
      brushLegend = <text x={0} y={innerHeight - annotationSize - 10} fontSize={12}>brush:</text>;
      annotation = (<g>
        <rect x={0} y={innerHeight - annotationSize} height={annotationSize} width={annotationSize} stroke={"black"} fill={"white"} fillOpacity={0.3}></rect>
        <rect x={selected.x1 / 100 * annotationSize} y = {innerHeight - selected.y2 / 100 * annotationSize} width={(selected.x2 - selected.x1) / 100 * annotationSize} height={(selected.y2 - selected.y1) / 100 * annotationSize} fill={"gray"} fillOpacity={0.3}></rect>
      </g>);
    }
    let indicator: JSX.Element = null;
    let circles: JSX.Element[] = null;
    if ((dataset) && (dataset.length > 0)) {
      // map selected data to SVG path/dots
      circles = dataset.map((d, i) =>
        <circle key={"_" + i + "_dot" + sId} r="1.5" cx={x(d.x)}
          cy={y(d.y)} fill={c} fillOpacity={0.5}></circle>
      );
    }
    return (
      <div className="chart-wrapper inline-block">
        <svg width={width} height={height}>
          <g transform={"translate(" + marginLeft + "," + marginTop + ")"}>
            {/* {guides} */}
            <g ref={(g) => d3.select(g).call(axisBottom)}
              transform={"translate(0," + innerHeight + ")"}></g>
            <g ref={(g) => d3.select(g).call(axisLeft)}></g>
            {circles}
            {brushDiv}
            <g transform={"translate(-90, 0)"}>
              {brushLegend}
              {annotation}
            </g>
            {label}
          </g>
          {axesLabels}
        </svg>
        {indicator}
      </div>
    );
};