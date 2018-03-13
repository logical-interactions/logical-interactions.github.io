import * as React from "react";
import * as d3 from "d3";

import MapZoom from "./MapZoom";
import Chart from "./Chart";

import { NWStart, SEStart } from "../lib/helper";
import { setupMapDB, getMapZoomStatements } from "../records/MapZoom/setup";

interface MapZoomContainerProps {
  logical: boolean;
}

export default class MapZoomContainer extends React.Component<MapZoomContainerProps, undefined> {

  componentDidMount() {
    // this mounts only when all children have mounted
    setupMapDB();
    let stmts = getMapZoomStatements();
    // initial view is just an interaction here
    stmts.insertNavItx.run([+new Date(), ...NWStart, ...SEStart]);
  }

  render() {
    return (<>
      <MapZoom
        logical={this.props.logical}
      />
      <Chart
        series={["Q1", "Q2", "Q3", "Q4"]}
      />
    </>);
  }
}