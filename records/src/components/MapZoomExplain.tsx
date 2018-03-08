import * as React from "react";

import QueryDb from "./QueryDb";
import MapZoomContainer from "./MapZoomContainer";
import { toggleStreaming } from "../lib/streamingPins";



interface MapZoomExplainState {
  // delay in mili seconds
  delay: number;
  showScent: boolean;
  streaming: boolean;
}

export default class MapZoomExplain extends React.Component<undefined, MapZoomExplainState> {
  constructor(props: undefined) {
    super(props);
    this.handleStreaming = this.handleStreaming.bind(this);
    this.state = {
      delay: 2000,
      showScent: false,
      streaming: false,
    };
  }
  handleStreaming() {
    this.setState(prevState => ({
      streaming: !prevState.streaming
    }));
    toggleStreaming();
  }
  render() {
    return (<>
      <p>Here, we have a scenario where in real time, a user is browsing login actvities of users, and they can select the dots to get some aggreated dataabout what the set of users selected.</p>
      <MapZoomContainer />
      <p>What is the framework we used to make that happen? First, there are two user initiated interactions: (1) panning the map and (2) brushing to select the pins. To capture these two interactions, we have some javascript hooks which computes the the specified region of the map via the upper left and lower right corner of the boudning box, so the two tables that store the interactions will look like the following. Ignore the <code>undoe</code> for now.</p>
      <pre><code>
      CREATE TABLE mapInteractions (
        itxId INTEGER PRIMARY KEY,
        ts INTEGER NOT NULL,
        latMin INTEGER NOT NULL,
        latMax INTEGER NOT NULL,
        longMin INTEGER NOT NULL,
        longMax INTEGER NOT NULL,
        undoed INTEGER DEFAULT 0
      );
      </code></pre>
      <QueryDb
        execute={false}
        key={"inspectMapInteractions"}
        query={`SELECT * FROM mapInteractions ORDER BY ts DESC LIMIT 10;`}
        explainTxt={"You can see your past panning and zooming interaction specifications by running the following code"}
      />
      <p>
        The code for the brush is slightly different, as the brush is dynamically udpated as the brush moves, so we introduce a basic one level hierachy where the with the first mouse down, we create an entry in <code>brushItx</code> and then we create entries in <code>brushItxItems</code>.v
      </p>
      <pre><code>
      CREATE TABLE brushItx(
        itxId INTEGER PRIMARY KEY,
        ts INTEGER NOT NULL,
        mapItxId INTEGER
      );
      CREATE TABLE brushItxItems (
        itxId INTEGER NOT NULL,
        ts INTEGER NOT NULL,
        latMin INTEGER NOT NULL,
        latMax INTEGER NOT NULL,
        longMin INTEGER NOT NULL,
        longMax INTEGER NOT NULL
      );
      </code></pre>
      <QueryDb
        key={"inspectMapInteractions"}
        query={`
        SELECT *
        FROM brushItx
          JOIN brushItxItems ON brushItx.itxId = brushItxItems.itxId
        ORDER BY ts DESC LIMIT 15;`}
        explainTxt={"You can see your past brush specifications by running the following code"}
      />
      <p>
        Notice how you can still interact with the map . Can't see it? Press the button to make the pins load slowerv
      </p>
      <button onClick={}></button>
      <p>
        To enable streaming, we can simply insert into the <code>pinData</code> table.  We implemented an (emulated) pulling function from the server to update the pins, click to see the effect on the visualization.
      </p>
      <button onClick={this.handleStreaming}>{this.state.streaming ? "Pause" : "Start"} Streaming </button>
      <p>
        The astute reader might point out that this is the simple case of streaming, where the mapping from pixel space to data space (the scale) of the interaction input is not affected by the streaming data. The framework offers a few declarative solutions.  One is whenever an interaction starts (note not necessarily rendered), freeze the current state of the UI and disallow new streamed in data to update, until the user is done with the interaction and expresses a wish to continue, releasing the "lock" on the screen.  Another option is that since interactions are specified in data space, we are guaranteed to have the correct visualization of input, so the streaming updates the screen, but also updates the interaction's pixel mapping.  If the scenario is such that the selection is dependent on <b>time</b>, we recommend the first solution, and the if the interaction is only dependnet on the scale and the scale doesn't change much, the second option could offer more "real time" exerpience. #TODO: implement two quick examples.v</p>
    </>);
  }
}