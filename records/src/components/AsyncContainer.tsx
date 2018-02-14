import * as React from "react";
import * as d3 from "d3";

import MapZoom from "./MapZoom";
import Chart from "./Chart";

import { getMapEventData, MapSelection, MapDatum, getRandomInt, getBrushData } from "../lib/data";
import { InteractionEntry, InteractionTypes, RequestEntry, ResponseEntry, MapState } from "../lib/history";

interface AsyncContainerState {
  showExample: boolean;
  interactionHistory: InteractionEntry[];
  requestHistory: RequestEntry[];
  responseHistory: ResponseEntry[];
  pop?: {[index: string]: number};
  mapData: MapDatum[];
}

export default class AsyncContainer extends React.Component<undefined, AsyncContainerState> {

  constructor(props: undefined) {
    super(props);
    this.toggleExample = this.toggleExample.bind(this);
    this.newInteraction = this.newInteraction.bind(this);
    this.processResponse = this.processResponse.bind(this);
    this.getMostRecentResponse = this.getMostRecentResponse.bind(this);
    this.setData = this.setData.bind(this);
    this.state = {
      showExample: false,
      mapData: [],
      interactionHistory: [],
      requestHistory: [],
      responseHistory: [],
    };
    d3.tsv("/data/world_population.tsv", (error: any, data: any[]) => {
      let pop: {[index: string]: number} = {};
      data.map((d) => {
        pop[d.name] = parseInt(d.population, 10);
      });
      this.setState({pop});
    });
    d3.csv("/data/events_sample.csv", this.setData);
    d3.csv("/data/rand_yelp.csv", this.setData);
    d3.csv("/data/hotel_sample.csv", this.setData);
  }

  setData(error: any, data: any[]) {
    let mapDataRaw = data.map((d) => {
      let lat = parseInt(d.latitude, 10);
      let long = parseInt(d.longitude, 10);
      // data not clean...
      let latJitter = Math.random() * 1;
      let longJitter = Math.random() * 2;
      if ((lat < 90) && (long < 180)) {
        return {
          lat: lat + latJitter,
          long: long + longJitter,
        };
      } else {
        console.log("bug", d.latitude, d.longitude);
      }
    });
    // get rid of nulls
    let mapData = mapDataRaw.filter(d => d);
    this.setState(prevState => {
      Array.prototype.push.apply(prevState.mapData, mapData);
      return({
        mapData: prevState.mapData,
      });
    });
    console.log("set Mapdata", mapData);
  }

  toggleExample() {
    this.setState(prevState => {
      return {showExample: !prevState.showExample};
    });
  }

  newInteraction(type: InteractionTypes, param: any, writeState?: any) {
    let itxid = this.state.interactionHistory.length;
    this.setState(prevState => {
      prevState.interactionHistory.push({
        itxid: prevState.interactionHistory.length,
        type,
        timestamp: new Date(),
        param,
        writeState
      });
      return prevState;
    });
    if (type === InteractionTypes.ZOOMMAP) {
      console.log("zoom", itxid);
      if (this.state.mapData) {
        getMapEventData(this.state.mapData, itxid, param)
        .then(this.processResponse);
      } else {
        setTimeout(
          getMapEventData(this.state.mapData, itxid, param)
          .then(this.processResponse), 300);
      }
    } else {
      // must be brush
      console.log("brush", itxid);
      // fetch data for barchart
      // fake some determinstic values...
      getBrushData(itxid, param)
        .then(this.processResponse);
    }
    return {
      itxid,
      requested: true
    };
    // a bit tricky here how to actually find that itxid...
    // since react can be async and the state could have mutated before this.setState is called??
  }

  processResponse(response: any) {
    const {selection, data, itxid} = response;
    console.log("Got response", response);
    this.setState((prevState) => {
      prevState.responseHistory.push({
        itxid,
        data
      });
      return {
        responseHistory: prevState.responseHistory
      };
    });
  }

  getMostRecentInteraction(t: InteractionTypes) {
    // get the most recent of t
    for (let i = this.state.interactionHistory.length - 1; i > -1; i--) {
      let itx = this.state.interactionHistory[i];
      if (itx.type === t) {
        return itx;
      }
    }
    return null;
  }

  getMostRecentResponse(t: InteractionTypes) {
    for (let i = this.state.responseHistory.length - 1; i > -1; i --) {
      let h = this.state.responseHistory[i];
      if (this.state.interactionHistory[h.itxid].type === t) {
        return h;
      }
    }
    return null;
  }

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
    let map: JSX.Element;
    if (this.state.showExample) {
      let zoomItx = this.getMostRecentInteraction(InteractionTypes.ZOOMMAP);
      let brushItx = this.getMostRecentInteraction(InteractionTypes.BURSHBAR);
      let pin = this.getMostRecentResponse(InteractionTypes.ZOOMMAP);
      map = <>
      <MapZoom
        pop={this.state.pop}
        currentMapState={{
          itxId: zoomItx.itxid,
          selection: zoomItx.param
        }}
        currentPinState={{
          itxId: pin.itxid,
          data: pin.data
        }}
        currentBrushState={{
          itxId: brushItx.itxid,
          selection: brushItx.param
        }}
        newInteraction={this.newInteraction}
      />
      <Chart
        data={this.getMostRecentResponse(InteractionTypes.BURSHBAR).data}
        series={SERIES}
      />
      </>;

    }

    let consistency = (<>
      <h2>Consistency: Taming the Wild</h2>
      <p>
        that we can design <i>with</i> asynchrony.  Currently, the most common practice is to block so that the response and requests are aligned in time, but one could also imagine many other designs where the correspondence is not serialized and matched through other means.
      </p>
      <h3>A Visualization Example</h3>
      <p>
        While there are consistency models in databases, it doesn't directly translate to the UI (we <a href="http://people.eecs.berkeley.edu/~yifanwu/assets/devil.pdf">tried</a>!).  Let's take a look at an example</p>
        {map}
        <button onClick={this.toggleExample}>Example</button>
      <h3>A Control Example</h3>
    </>);

    return (<>
      {consistency}
    </>);
  }
}