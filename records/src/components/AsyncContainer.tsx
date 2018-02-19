import * as React from "react";
import * as d3 from "d3";

import MapZoom from "./MapZoom";
import Chart from "./Chart";

import { MapSelection, MapDatum, getRandomInt, getBrushData, Coords } from "../lib/data";
import { InteractionEntry, InteractionTypes, RequestEntry, ResponseEntry, MapState } from "../lib/history";

// import { db } from "../records/setup";
import { insertInteractionStmt } from "../records/setup";

interface AsyncContainerState {
  showExample: boolean;
  pop?: {[index: string]: number};
}

export default class AsyncContainer extends React.Component<undefined, AsyncContainerState> {

  constructor(props: undefined) {
    super(props);
    this.toggleExample = this.toggleExample.bind(this);
    // this.newInteraction = this.newInteraction.bind(this);
    // this.processResponse = this.processResponse.bind(this);
    // this.getMostRecentResponse = this.getMostRecentResponse.bind(this);
    this.state = {
      showExample: true,
    };
    d3.tsv("/data/world_population.tsv", (error: any, data: any[]) => {
      let pop: {[index: string]: number} = {};
      data.map((d) => {
        pop[d.name] = parseInt(d.population, 10);
      });
      this.setState({pop});
    });
  }

  componentDidMount() {
    // set this up so there is access
    let nw = [-173, 77];
    let se = [163, -43];
    insertInteractionStmt.run([+new Date(), ...nw, ...se]);
  }

  toggleExample() {
    this.setState(prevState => {
      return {showExample: !prevState.showExample};
    });
  }

  // getMostRecentInteraction(t: InteractionTypes) {
  //   // get the most recent of t
  //   for (let i = this.state.interactionHistory.length - 1; i > -1; i--) {
  //     let itx = this.state.interactionHistory[i];
  //     if (itx.type === t) {
  //       return itx;
  //     }
  //   }
  //   return null;
  // }

  // getMostRecentResponse(t: InteractionTypes) {
  //   for (let i = this.state.responseHistory.length - 1; i > -1; i --) {
  //     let h = this.state.responseHistory[i];
  //     if (this.state.interactionHistory[h.itxid].type === t) {
  //       return h;
  //     }
  //   }
  //   return null;
  // }

  render() {
    const SERIES = ["jeans", "t-shirt", "coat", "shoes"];
    let examples = (<>
      <h2>Bad Async Interactions In the Wild</h2>
      <h3>The hard to read</h3>
      <i>"Did it get it?", "Should I click again?", "What's happening?"</i>
      <h3>The Confusing</h3>
      <p>
        Here i
      </p>
      <h3>The Mistake</h3>
      <p>
        This viral <a href="https://gfycat.com/QueasyGrandIriomotecat">humorous gif</a> about the not so funny missile alert show cases what happens when <b>human latency</b> is ignored.</p>
      <video controls>
        <source src="media/misslewarning.webm" type="video/webm"/>
      </video>
      <p>
        Even though to the computer you are clicking on the object it has rendered, humans have roughly <b>200 miliseconds</b> delay between deciding in the head and actually executing the click.  How to fix this kind of errors? It is clear that we cannot predict the future. However the developer must have a way of knowing the past version that the user was interacting with.
      </p>
    </>);
    // let map: JSX.Element;
    // if (this.state.showExample) {
    //   // let zoomItx = this.getMostRecentInteraction(InteractionTypes.ZOOMMAP);
    //   // let brushItx = this.getMostRecentInteraction(InteractionTypes.BURSHBAR);
    //   // let pin = this.getMostRecentResponse(InteractionTypes.ZOOMMAP);
    //   // let chartItx = this.getMostRecentResponse(InteractionTypes.BURSHBAR);
    //   let brushState = brushItx ? {
    //     itxId: brushItx.itxId,
    //     selection: brushItx.param
    //   } : null;
    //   let pinState = pin ? {
    //     itxId: pin.itxid,
    //     data: pin.data
    //   } : null;
    //   let chart: JSX.Element;
    //   if (chartItx) {
    //     chart = <Chart
    //       data={chartItx.data}
    //       series={SERIES}
    //     />;
    //   }
    //   map = <>
    //     <MapZoom
    //       pop={this.state.pop}
    //       currentMapState={{
    //         itxId: zoomItx.itxId,
    //         selection: zoomItx.param
    //       }}
    //       currentPinState={pinState}
    //       currentBrushState={brushState}
    //     />
    //   </>;
    // }

    let consistency = (<>
      <h2>Consistency: Taming the Wild</h2>
      <p>
        that we can design <i>with</i> asynchrony.  Currently, the most common practice is to block so that the response and requests are aligned in time, but one could also imagine many other designs where the correspondence is not serialized and matched through other means.
      </p>
      <h3>A Visualization Example</h3>
      <p>
        While there are consistency models in databases, it doesn't directly translate to the UI (we <a href="http://people.eecs.berkeley.edu/~yifanwu/assets/devil.pdf">tried</a>!).  Let's take a look at an example</p>
        {<MapZoom
          population={this.state.pop}
        />}
        <button onClick={this.toggleExample}>Example</button>
      <h3>A Control Example</h3>
    </>);

    return (<>
      {consistency}
    </>);
  }
}