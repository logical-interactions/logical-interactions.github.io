import * as d3 from "d3";
import * as React from "react";

import Indicator from "./Indicator";

import { ColorScales } from "../lib/chronicles";
import { Datum } from "../lib/data";
import { Rect } from "../lib/geometry";

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
}

/**
 * Represents an SVG chart. The chart uses the selected data from props to
 * render the appropriate path(s). d3 is used to generate axes and scales.
 */
export default class Scatterplot extends React.Component<ScatterplotProps, undefined> {
  static defaultProps = {
    color: "blue",
    height: 300,
    marginBottom: 40,
    marginLeft: 45,
    marginRight: 20,
    marginTop: 20,
    width: 400,
    showLabel: false,
    showAxesLabels: true,
  };

  render() {
    const { dataset, selected, height, marginBottom,
            marginLeft, marginRight, marginTop, width, color, updateSelection } = this.props;
    let { xDomain, yDomain } = this.props;
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

    // loading indicator(s)
    let indicators = [];

    // guide marks
    const guides = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(d => {
      return (
        <line
          key={d}
          x1={0}
          x2={innerWidth}
          y1={y(d)}
          y2={y(d)}
          stroke="rgb(189, 189, 189)">
        </line>
      );
    });

    let sId = selected.x1.toString() + selected.x2.toString() + selected.y1.toString() + selected.y2.toString();

    // map selected data to SVG path/dots
    let circles: JSX.Element[] = dataset.map((d, i) =>
      <circle key={"_" + i + "_dot" + sId} r="2.5" cx={x(d.x)}
        cy={y(d.y)} fill={c}></circle>
    );
    if (dataset === undefined) {
      indicators.push(
        <Indicator key={"ind_" + sId} loading={true} />
      );
    }
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
            Year
          </text>
          <text
            className="chart-label"
            x={-(innerHeight / 2) - marginTop}
            y={15}
            transform="rotate(-90)"
            textAnchor="middle"
          >
            Stock price
          </text>
        </g>
      );
    }
    let brush: any;
    // generate a brush that interacts with the chart
    if (this.props.selectable) {
      brush = d3.brush()
      .extent([[0, 0], [innerWidth, innerHeight]])
      .on("end", function() {
        const s = d3.brushSelection(this) as [[number, number], [number, number]];
        if (s !== null) {
          updateSelection({x1: s[0][0], y1: s[1][0], x2: s[0][1], y2: s[1][1]} as Rect);
        }
      });
    }
    return (
      <div className="chart-wrapper inline-block">
        <svg width={width} height={height}>
          <g transform={"translate(" + marginLeft + "," + marginTop + ")"}>
            {guides}
            <g ref={(g) => d3.select(g).call(axisBottom)}
              transform={"translate(0," + innerHeight + ")"}></g>
            <g ref={(g) => d3.select(g).call(axisLeft)}></g>
            {circles}
            {label}
          </g>
          {axesLabels}
          <g ref={ g => d3.select(g).call(brush) }></g>
        </svg>
        {indicators}
      </div>
    );
  }
}
