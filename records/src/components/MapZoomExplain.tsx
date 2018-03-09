import * as React from "react";

import QueryDb from "./QueryDb";
import MapZoomContainer from "./MapZoomContainer";
import { toggleStreaming } from "../lib/streamingPins";
import { mapZoomLatency } from "../lib/data";

interface MapZoomExplainState {
  // delay in mili seconds
  delay: number;
  showScent: boolean;
  streaming: boolean;
  isLogical: boolean;
}

export default class MapZoomExplain extends React.Component<undefined, MapZoomExplainState> {
  constructor(props: undefined) {
    super(props);
    this.handleStreaming = this.handleStreaming.bind(this);
    this.makeLogical = this.makeLogical.bind(this);
    this.state = {
      delay: 2000,
      showScent: false,
      streaming: false,
      isLogical: false,
    };
  }

  makeLogical() {
    this.setState({isLogical: true});
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
      <div style={{position: "sticky", top: 0, backgroundColor: "white"}}>
        <MapZoomContainer
          logical={this.state.isLogical}
        />
      </div>
      <p>What is the framework we used to make that happen? First, there are two user initiated interactions: (1) panning the map and (2) brushing to select the pins. To capture these two interactions, we have some javascript hooks which computes the the specified region of the map via the upper left and lower right corner of the boudning box, so the two tables that store the interactions will look like the following. Ignore the <code>undoe</code> for now.</p>
      <QueryDb
        key={"defineMapInteractions"}
        hideQuery={true}
        query={
          `SELECT sql
          FROM sqlite_master
          WHERE
            type = 'table'
            AND name = 'mapInteractions'`}
      />
      <QueryDb
        execute={false}
        key={"inspectMapInteractions"}
        query={`SELECT * FROM mapInteractions ORDER BY ts DESC LIMIT 10;`}
        explainTxt={"You can see your past panning and zooming interaction specifications by running the following code"}
      />
      <p>
        The code for the brush is slightly different, as the brush is dynamically udpated as the brush moves, so we introduce a basic one level hierachy where the with the first mouse down, we create an entry in <code>brushItx</code> and then we create entries in <code>brushItxItems</code>.v
      </p>
      <QueryDb
        key={"defineBrushItx"}
        hideQuery={true}
        query={
          `SELECT name, sql
          FROM sqlite_master
          WHERE
            type = 'table'
            AND (name = 'brushItx' OR name = 'brushItxItems')`}
      />
      <QueryDb
        key={"inspectBrushItx"}
        query={`
        SELECT *
        FROM brushItx
          JOIN brushItxItems ON brushItx.itxId = brushItxItems.itxId
        ORDER BY ts DESC LIMIT 15;`}
        explainTxt={"You can see your past brush specifications by running the following code"}
      />
      <p>
        Notice how you can still interact with the map when the pin results are being loaded. Can't see it? Press the button to make the pins load slower.
      </p>
      <button onClick={() => {
        let l = mapZoomLatency("pin");
        mapZoomLatency("pin", l.min + 2000, l.max + 2000);
      }}>Make pin loading slower</button>
      <p>What we did here is that d</p>
      <QueryDb
        key={"defineBrushItx"}
        hideQuery={true}
        query={
          `SELECT name, sql
          FROM sqlite_master
          WHERE
            type = 'view'
            AND name = 'mapOnlyState'`}
      />
      <p>
        Let's say somehow you want the panning to block, that is, do not render the map until the pins have loaded, and also disable brushing, then you can do the following.
      </p>
      <QueryDb
        query={`
        DROP VIEW mapOnlyState;
        CREATE VIEW mapOnlyState AS
          SELECT
            mapInteractions.itxId,
            mapInteractions.ts
          FROM
            mapInteractions
            JOIN pinResponses ON pinResponses.itxId = mapInteractions.itxId
            ORDER BY pinResponses.itxId DESC LIMIT 1;
        `}
        explainTxt={"Note the last two lines, instead of previously selecting the most recent interaction, we are selecting the first render."}
        key={"changeToBlocking"}
      />
      <p>
        At this point perhaps a lot of the pins are already cached, so again you cannot see the effects of latency, well, we can clear the cache by simply running the following queries.
      </p>
      <QueryDb
        query={`
          DELETE FROM pinResponses;
          DELETE FROM pinData;
        `}
      />}
      <p>
        Note also that since the current map state does not change in the React component, even if the button is pressed multiple times, because the derived data space specification would be the same.  In order to implement blocking and allow users to navigate, we can change the interactions to "intentions" and evaluate on the server side, or alternatively push the temporary state to the client state.  If the data is not knowable by the client, then this has to be done on the server. In this case, it is knowable. We've instrumented the React code to toggle between these two options. Click on the button to see the effect
      </p>
      <button onClick={this.makeLogical}>Separate interaction intention (logical interaction)</button>
      <p>
        As you can see, data dependent controls are pretty hard to reason about both for the developer and the users in the face of high latency and asynchrony, even with our framework, because the application logic is more complex.  We encourage designing with data <i>independent</i> controls.
      </p>
      <p>
        To enable streaming, we can simply insert into the <code>pinData</code> table.  We implemented an (emulated) pulling function from the server to update the pins, click to see the effect on the visualization.
      </p>
      <button onClick={this.handleStreaming}>{this.state.streaming ? "Pause" : "Start"} Streaming </button>
      <p>
        The astute reader might point out that this is the simple case of streaming, where the mapping from pixel space to data space (the scale) of the interaction input is not affected by the streaming data. The framework offers a few declarative solutions.  One is whenever an interaction starts (note not necessarily rendered), freeze the current state of the UI and disallow new streamed in data to update, until the user is done with the interaction and expresses a wish to continue, releasing the "lock" on the screen.  Another option is that since interactions are specified in data space, we are guaranteed to have the correct visualization of input, so the streaming updates the screen, but also updates the interaction's pixel mapping.  If the scenario is such that the selection is dependent on <b>time</b>, we recommend the first solution, and the if the interaction is only dependnet on the scale and the scale doesn't change much, the second option could offer more "real time" exerpience. #TODO: implement two quick examples.
      </p>
    </>
    );
  }
}