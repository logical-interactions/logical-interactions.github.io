import * as d3 from "d3";
import * as React from "react";

import Indicator from "./Indicator";

import { ColorScales } from "../lib/chronicles";
import { Datum } from "../lib/data";

interface ChartProps {
  bufferSize: number;
  children?: React.ReactChildren;
  colorOverride?: boolean;
  datasets: { [index: string]: Datum[] };
  height?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  selected: string[];
  width?: number;
  xDomain?: [number, number];
  yDomain?: [number, number];
  showLabel?: boolean;
  showAxesLabels?: boolean;
  colorScale: (i: number) => string;
}

/**
 * Represents an SVG chart. The chart uses the selected data from props to
 * render the appropriate path(s). d3 is used to generate axes and scales.
 */
export default class Chart extends React.Component<ChartProps, undefined> {
  static defaultProps = {
    colorOverride: false,
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
    const { bufferSize, datasets, selected, colorOverride, height, marginBottom,
            marginLeft, marginRight, marginTop, width, colorScale } = this.props;
    let { xDomain, yDomain } = this.props;
    const innerWidth = width - marginLeft - marginRight;
    const innerHeight = height - marginTop - marginBottom;

    // set the scales
    if (!xDomain) {
      xDomain = [
        d3.min(Object.keys(datasets).map(ds => d3.min(datasets[ds], d => d.x))),
        d3.max(Object.keys(datasets).map(ds => d3.max(datasets[ds], d => d.x)))
      ];
    }
    if (!yDomain) {
      yDomain = [
        d3.min(Object.keys(datasets).map(ds => d3.min(datasets[ds], d => d.y))),
        d3.max(Object.keys(datasets).map(ds => d3.max(datasets[ds], d => d.y)))
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

    // set the color(s)
    // if (colorOverride) {
    //   colorScale = () => color;
    // } else {
    //   colorScale = colorScale; // ColorScales[color](bufferSize);
    // }

    // path generator
    const line = d3.line<Datum>()
                   .x((d) => x(d.x))
                   .y((d) => y(d.y));

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

    // map selected data to SVG path/dots
    let paths: JSX.Element[] = [];
    for (let i = 0; i < selected.length; i++) {
      const s = selected[i];
      if (datasets[s] === undefined) {
        indicators.push(
          <Indicator key={"ind_" + i} loading={true} />
        );
        continue; // if undefined, then the data is still being requested
      }
      const c = colorScale(selected.length - 1 - i);

      // path
      paths.push(
        <path key={s + "_line"} fill="none" stroke={c}
          strokeWidth="2" d={line(datasets[s])}></path>
      );

      // dots
      Array.prototype.push.apply(paths, datasets[s].map((d, i) =>
        <circle key={s + "_" + i + "_dot"} r="2.5" cx={x(d.x)}
          cy={y(d.y)} fill={c}></circle>
      ));
    }
    let label;
    if (this.props.showLabel) {
      label = (
        <text
          className="chart-label"
          x={innerWidth / 2}
          y={-8}
          textAnchor="middle"
        >
          {selected[0]}
        </text>
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

    return (
      <div className="chart-wrapper inline-block">
        <svg width={width} height={height}>
          <g transform={"translate(" + marginLeft + "," + marginTop + ")"}>
            {guides}
            <g ref={(g) => d3.select(g).call(axisBottom)}
              transform={"translate(0," + innerHeight + ")"}></g>
            <g ref={(g) => d3.select(g).call(axisLeft)}></g>
            {paths}
            {label}
            {this.props.children}
          </g>
          {axesLabels}
        </svg>
        {indicators}
      </div>
    );
  }
}
