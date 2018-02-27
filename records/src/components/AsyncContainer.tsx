import * as React from "react";
import * as d3 from "d3";

import MapZoom from "./MapZoom";
import Chart from "./Chart";

import { NW, SE } from "../lib/helper";
import { MapSelection, getRandomInt, getUserhData, Coords } from "../lib/data";
import { db } from "../records/setup";
import { setupMapDB, stmts } from "../records/mapZoomSetup";


interface AsyncContainerState {
  showExample: boolean;
  // pop?: {[index: string]: number};
}

export default class AsyncContainer extends React.Component<undefined, AsyncContainerState> {

  constructor(props: undefined) {
    super(props);
    this.toggleExample = this.toggleExample.bind(this);
    this.state = {
      showExample: true,
    };
    // d3.tsv("/data/world_population.tsv", (error: any, data: any[]) => {
    //   let pop: {[index: string]: number} = {};
    //   data.map((d) => {
    //     pop[d.name] = parseInt(d.population, 10);
    //   });
    //   this.setState({pop});
    //   console.log("population object", pop);
    // });
  }

  // so this mounts only when all children have mounted, great!
  componentDidMount() {
    setupMapDB();
    // set this up so there is access
    stmts().insertNavItx.run([+new Date(), ...NW, ...SE]);
  }

  toggleExample() {
    this.setState(prevState => {
      return {showExample: !prevState.showExample};
    });
  }

  render() {
    return (<>
      <MapZoom
      />
      <Chart
        series={["Q1", "Q2", "Q3", "Q4"]}
      />
    </>);
  }
}