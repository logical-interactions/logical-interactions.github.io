import * as React from "react";
import * as d3 from "d3";

import MapZoom from "./MapZoom";
import Chart from "./Chart";

import { NWStart, SEStart } from "../lib/helper";
import { setupMapDB, getMapZoomStatements } from "../records/MapZoom/setup";

interface MapZoomContainerProps {
  logical: boolean;
}

const MAXWIDTH = 800;

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
    <div style={{float: "left"}}>
    <>
      <MapZoom
        width={MAXWIDTH * 0.7}
        logical={this.props.logical}
      />
    </>
    </div>
    <div style={{float: "left"}}>
      <Chart
        width={MAXWIDTH * 0.2}
        series={["Q1", "Q2", "Q3", "Q4"]}
      />
    </div>
    </>);
  }
}