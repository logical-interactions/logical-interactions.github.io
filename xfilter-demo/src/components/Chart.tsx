import * as React from "react";
import * as d3 from "d3";

import { db } from "../records/setup";
import { Datum } from "../lib/data";
import { SvgSpinner } from "./SvgSpinner";

interface ChartProps {
  series: string[];
  height?: number;
  spinnerRadius?: number;
  width?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  yDomain?: [number, number];
}

interface ChartState {
  data: number[];
  pending: boolean;
}

export default class Chart extends React.Component<ChartProps, ChartState> {
  static defaultProps = {
    colorOverride: false,
    height: 200,
    spinnerRadius: 20,
    marginBottom: 40,
    marginLeft: 45,
    marginRight: 20,
    marginTop: 20,
    width: 300,
    showLabel: false,
    showAxesLabels: true,
  };

  constructor(props: ChartProps) {
    super(props);
    this.setChartDataState = this.setChartDataState.bind(this);
    this.setChartPending = this.setChartPending.bind(this);
    this.state = {
      data: null, // just to test that it's working?
      pending: false,
    };
  }

  componentDidMount() {
    db.create_function("setChartPending", this.setChartPending);
    db.create_function("setChartDataState", this.setChartDataState);
  }

  setChartPending(pending: boolean) {
    // console.log("setChartPending", pending);
    this.setState({
      pending,
    });
  }

  setChartDataState(q1: number, q2: number, q3: number, q4: number) {
    if ((q1 !== null) && (q2 !== null) && (q3 !== null) && (q4 !== null)) {
      // console.log("setting chart data state", arguments);
      this.setState({
        data: [q1, q2, q3, q4],
      });
    } else {
      this.setState({
        data: null,
      });
    }
  }

  render() {
    let { width, height, series, marginLeft, marginRight, marginTop, marginBottom, spinnerRadius } = this.props;
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
    if (data) {
      const innerWidth = width - marginLeft - marginRight;
      const innerHeight = height - marginTop - marginBottom;
      let x = d3.scaleBand()
                .rangeRound([0, innerWidth])
                .padding(0.2)
                .domain(series);
      let y = d3.scaleLinear()
                .rangeRound([innerHeight, 0])
                .domain([0, d3.max(data)]);
      // get y scale and x positioning
      let bars = data.map((d, i) => <rect x={x(series[i])} y={y(d)} width={x.bandwidth()} height={innerHeight - y(d)} fill={"rgb(255, 192, 203, 0.5)"}></rect>);
      vis = <g>
              {bars}
              <g ref={(g) => d3.select(g).call(d3.axisLeft(y).ticks(5, "d"))}></g>
              <g ref={(g) => d3.select(g).call(d3.axisBottom(x).ticks(4))} transform={"translate(0," + innerHeight + ")"}></g>
              {spinner}
            </g>;
    } else {
      vis = spinner;
    }
    // console.log("height", height + spinnerRadius * 3);
    return(<svg  width={width} height={height + spinnerRadius * 3}>
      {vis}
    </svg>);
  }
}