import * as React from "react";
import * as d3 from "d3";

import { db } from "../sql/setup";
import { brushItx } from "../sql/streaming/customSetup";
import { Datum } from "../lib/data";
import { SvgSpinner } from "./SvgSpinner";


interface LineChartProps {
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
}

export default class LineChart extends React.Component<LineChartProps, LineChartState> {
  brushG: SVGGElement;
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
    this.state = {
      data: null,
      pending: false,
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
    console.log("setting line chart state", data);
    this.setState({data});
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
      let line = d3.line<Datum>().x((d) => x(d.x)).y((d) => y(d.y))(data);
      let brush = d3.brushX()
        .extent([[0, 0], [innerWidth, innerHeight]])
        .on("end", function() {
          // [[x0, y0]
          const s = d3.brushSelection(this) as [number, number];
          if (s === null) {
            // this is a deselection
            brushItx(-1, -1);
          } else {
            let sx = s.map(x.invert);
            console.log("brushed", d3.brushSelection(this), "mapped", sx);
            brushItx(sx[0], sx[1]);
          }
        });

      vis = <g>
        <path stroke="steelblue" fill="none" stroke-wdith="1.5" d={line}></path>
        <g ref={ g => {
            this.brushG = g;
            (window as any).brushG = g;
            (window as any).brush = brush;
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