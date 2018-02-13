import * as React from "react";
import * as d3 from "d3";

import {Datum} from "../lib/data";

interface ChartProps {
  bufferSize: number;
  children?: React.ReactChildren;
  colorOverride?: boolean;
  datasets: { [index: string]: Datum[] };
  height?: number;
  indicatorOn?: boolean;
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

interface ChartState {
  currentVersion: number;
}

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
    return(<></>);
  }
}