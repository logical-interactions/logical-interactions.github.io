import * as React from "react";
import * as d3 from "d3";

import { db } from "../sql/setup";
import { getComponentPendingFuncName, getComponentStateFuncName } from "../sql/setup";
import { Datum } from "../lib/data";
import { SvgSpinner } from "./SvgSpinner";

interface ChartProps {
  chartName: string;
  label: string;
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

export default class BarChart extends React.Component<ChartProps, ChartState> {
  static defaultProps = {
    colorOverride: false,
    height: 150,
    spinnerRadius: 20,
    marginBottom: 40,
    marginLeft: 50,
    marginRight: 25,
    marginTop: 20,
    width: 300,
  };

  constructor(props: ChartProps) {
    super(props);
    this.setChartPending = this.setChartPending.bind(this);
    this.setChartDataState = this.setChartDataState.bind(this);
    this.state = {
      data: null,
      pending: false,
    };
  }

  // componentDidMount() {
  //   db.create_function(getComponentPendingFuncName(this.props.chartName), this.setChartPending);
  //   db.create_function(getComponentStateFuncName(this.props.chartName), this.setChartDataState);
  // }

  setChartPending(pending: boolean) {
    this.setState({
      pending,
    });
  }

  setChartDataState(data: number[]) {
    // console.log(`bar chart ${this.props.chartName}`, data);
    this.setState({
      data,
    });
    console.log("data: ",data)
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
      // get y scale and x positioning ?
      let bars = data.map((d, i) => <rect x={x(series[i])} y={y(d) ? y(d) : 0} width={x.bandwidth()} height={innerHeight - y(d)} fill={"rgb(255, 192, 203, 0.5)"}></rect>);
      vis = <g>
              {bars}
              <g ref={(g) => d3.select(g).call(d3.axisLeft(y).ticks(5))}></g>
              <g ref={(g) => d3.select(g).call(d3.axisBottom(x).ticks(4))
                               .selectAll("text")
                                  .attr("transform", "rotate(-35)")
                                  .style("text-anchor", "end")
                                  .attr("dx", "-.8em")
                                  .attr("dy", ".15em")
                    } transform={"translate(0," + innerHeight + ")"}></g>
              {spinner}
            </g>;
    } else {
      vis = spinner;
    }
    // console.log("height", height + spinnerRadius * 3);
    return(<svg  width={width} height={height + spinnerRadius * 3}>
      <g transform={"translate(" + marginLeft + "," + marginTop + ")"}>
        {vis}
      </g>
    </svg>);
  }
}