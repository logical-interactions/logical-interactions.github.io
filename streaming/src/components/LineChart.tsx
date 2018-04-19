import * as React from "react";
import * as d3 from "d3";

import { db } from "../sql/setup";
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
                .rangeRound([height, 0])
                .domain(d3.extent(data, (d) => d.x));
      let x = d3.scaleLinear()
                .rangeRound([0, width])
                .domain(d3.extent(data, (d) => d.y));
      let line = d3.line<Datum>().x((d) => x(d.x)).y((d) => y(d.y))(data);
      vis = <path stroke="steelblue" fill="none" stroke-wdith="1.5" d={line}></path>;
    }

    return (<svg  width={width} height={height + spinnerRadius * 3}>
      {vis}
    </svg>);
  }
}