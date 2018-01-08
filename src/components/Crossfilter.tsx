import * as d3 from "d3";
import * as React from "react";

import Indicator from "./Indicator";
import { XFilterDatum, XFilterSelection } from "../lib/data";


interface CrossfilterProps {
  datasets: XFilterDatum[];
}

interface CrossfilterState {
  selections: XFilterSelection[];
}

export default class Crossfilter extends React.Component<CrossfilterProps, CrossfilterState> {

  render() {
    return(<div>

    </div>);
  }
}