import * as React from "react";
import * as d3 from "d3";

import { MapDatum} from "../lib/data";

interface AsyncContainerState {
  showExample: boolean;
  pop?: {[index: string]: number};
  mapData?: MapDatum[];
}

import MapZoom from "./MapZoom";
export default class AsyncContainer extends React.Component<undefined, AsyncContainerState> {

  constructor(props: undefined) {
    super(props);
    this.toggleExample = this.toggleExample.bind(this);
    this.setData = this.setData.bind(this);
    this.state = {
      showExample: false
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
    // this.setState(prevState => {
    //   // console.log("merged data", prevState.responseHistory[0].data);
    //   return({
    //     mapData,
    //     responseHistory: prevState.responseHistory
    //   });
    // });
    // console.log("responseHistory", this.state.responseHistory);
  }

  toggleExample() {
    this.setState(prevState => {
      return {showExample: !prevState.showExample};
    });
  }

  render() {
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
      map = <MapZoom
        pop={this.state.pop}
        mapData={this.state.mapData}
      />;
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