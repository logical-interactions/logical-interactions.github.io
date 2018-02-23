import * as React from "react";
import * as d3 from "d3";

import { db } from "../records/setup";
import { Datum } from "../lib/data";

interface ChartProps {
  series: string[];
  height?: number;
  width?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  yDomain?: [number, number];
}

interface ChartState {
  data: number[];
}

export default class Chart extends React.Component<ChartProps, ChartState> {
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

  constructor(props: ChartProps) {
    super(props);
    this.setChartDataState = this.setChartDataState.bind(this);
    this.state = {
      data: null,
    };
  }

  componentDidMount() {
    db.create_function("setChartDataState", this.setChartDataState);
  }

  setChartDataState(q1: number, q2: number, q3: number, q4: number) {
    this.setState({data: [q1, q2, q3, q4]});
  }

  render() {
    let { width, height, series } = this.props;
    let { data } = this.state;
    let x = d3.scaleBand()
              .rangeRound([0, width])
              .padding(0.1)
              .domain(series);
    let y = d3.scaleLinear()
              .rangeRound([height, 0])
              .domain([0, d3.max(data)]);

    // get y scale and x positioning
    let bars = data.map((d, i) => <rect x={x(series[i])} y={y(d)}  width={x.bandwidth()} height={height - y(d)}></rect>);
    return(<svg>
      <g ref={(g) => d3.select(g).call(d3.axisBottom(x))}></g>
      {bars}
      <g ref={(g) => d3.select(g).call(d3.axisLeft(y))}></g>
    </svg>);
  }
}