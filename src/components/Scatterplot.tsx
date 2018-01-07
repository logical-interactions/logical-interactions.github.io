import * as d3 from "d3";
import * as React from "react";

import Indicator from "./Indicator";

import { ColorScales } from "../lib/chronicles";
import { Datum } from "../lib/data";
import { Rect, rectToString } from "../lib/geometry";

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
    annotationSize: 100,
    showLabel: false,
    showAxesLabels: true,
  };

  render() {
    const { dataset, selected, height, marginBottom, annotationSize,
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
    }
    let brushDiv: JSX.Element = null;
    let annotation: JSX.Element = null;
    if (this.props.selectable) {
      brushDiv = <g ref={ g => d3.select(g).call(brush) }></g>;
    } else {
      // this is a result component
      // need to basically create a smaller version of the brush and the original box
      // hard code 100
      annotation = (<g>
        <rect x={0} y={innerHeight - annotationSize} height={annotationSize} width={annotationSize} fill={"yellow"} fillOpacity={0.3}></rect>
        <rect x={selected.x1 / 100 * annotationSize} y = {innerHeight - selected.y2 / 100 * annotationSize} width={(selected.x2 - selected.x1) / 100 * annotationSize} height={(selected.y2 - selected.y1) / 100 * annotationSize} fill={"green"} fillOpacity={0.3}></rect>
      </g>);
    }
    let indicator: JSX.Element = null;
    let circles: JSX.Element[] = null;
    if ((dataset) && (dataset.length > 0)) {
      // map selected data to SVG path/dots
      circles = dataset.map((d, i) =>
        <circle key={"_" + i + "_dot" + sId} r="2.5" cx={x(d.x)}
          cy={y(d.y)} fill={c}></circle>
      );
    } else {
      indicator = <Indicator
      loading={true}
    />;
    }
    return (
      <div className="chart-wrapper inline-block">
        <svg width={width} height={height}>
          <g transform={"translate(" + marginLeft + "," + marginTop + ")"}>
            {guides}
            <g ref={(g) => d3.select(g).call(axisBottom)}
              transform={"translate(0," + innerHeight + ")"}></g>
            <g ref={(g) => d3.select(g).call(axisLeft)}></g>
            {brushDiv}
            {circles}
            {annotation}
            {label}
          </g>
          {axesLabels}
        </svg>
        {indicator}
      </div>
    );
  }
}