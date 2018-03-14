import * as React from "react";

import QueryDb from "./QueryDb";
import MapZoomContainer from "./MapZoomContainer";
import { toggleStreaming } from "../lib/streamingPins";
import { mapZoomLatency } from "../lib/data";
import { removeCacheSQL, switchToBlocking, switchToNoneBlocking } from "../records/MapZoom/setup";

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

  render() {
    return (<>
      <h2>Map Navigation and Brushing Interaction Example</h2>
      <p>Here, we have a scenario where in real time, a user is browsing login actvities of users, and they can select the dots to get some aggreated dataabout what the set of users selected.</p>
      <div style={{position: "sticky", top: 0, backgroundColor: "white"}}>
        <MapZoomContainer
          logical={this.state.isLogical}
        />
      </div>
      <p>What is the framework we used to make that happen? First, there are two user-initiated interactions: (1) panning the map and (2) brushing to select the pins. To capture these two interactions, we have some javascript hooks which computes the specified region of the map via the upper left and lower right corner of the bounding box, so the two tables that store the interactions will look like the following. Ignore the <code>undoe</code> for now.</p>
      <QueryDb
        key={"defineMapItx"}
        hideQuery={true}
        query={
          `SELECT sql
          FROM sqlite_master
          WHERE
            type = 'table'
            AND name = 'mapItx'`}
      />
      <QueryDb
        execute={false}
        key={"inspectMapItx"}
        query={`SELECT * FROM mapItx ORDER BY ts DESC LIMIT 10;`}
        explainTxt={"You can see your past panning and zooming interaction specifications by running the following code"}
      />
      <p>
        The code for the brush is slightly different, as the brush is dynamically updated as the brush moves, so we introduce a basic one level hierarchy where the with the first mouse down, we create an entry in <code>brushItx</code> and then we create entries in <code>brushItxItems</code>.v
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
      <button className="btn" onClick={() => {
        let l = mapZoomLatency("pin");
        mapZoomLatency("pin", l.min + 2000, l.max + 2000);
      }}>Make pin loading slower</button>
      <p>What we did here is that we are allowing the state of the map to be defined by the most recent interaction regardless of whether its data sdepencicies have loaded as below.</p>
      <QueryDb
        key={"definemapOnlyStateNoneBlocking"}
        hideQuery={true}
        execute={true}
        query={
          `SELECT name, sql
          FROM sqlite_master
          WHERE
            type = 'view'
            AND name = 'mapOnlyStateNoneBlocking'`}
      />
      <p>
        Let's say somehow you want the panning interation to block, that is, do not render the map until the pins have loaded, and also disable brushing, then you can do the following.
      </p>
      <QueryDb
        hideQuery={true}
        execute={true}
        query={`SELECT name, sql
        FROM sqlite_master
        WHERE
          type = 'view'
          AND name = 'mapOnlyStateBlocking'`}
        explainTxt={`The following code fines mapOnlyStateBlocking, which is a view that "blocks" state from being updated until the pins have loaded locally, it decides what interaction defines the current state by selecting the most recently loaded pin.`}
        key={"seeMapOnlyStateBlocking"}
      />
      <p>
        You can switch back and forth between the following options to test it out.
      </p>
      <QueryDb
        query={switchToBlocking}
        hideQuery={true}
        key={"changeToBlocking"}
        buttonTxt={"change to blocking map navigation"}
      />
      <QueryDb
        query={switchToNoneBlocking}
        hideQuery={true}
        key={"changeToNoneBlocking"}
        buttonTxt={"change to none blocking map navigation"}
      />
      <p>
        At this point perhaps a lot of the pins are already cached, so again you cannot see the effects of latency, well, we can clear the cache by simply running the following queries.
      </p>
      <QueryDb
        query={removeCacheSQL}
      />
      <p>
        These queries highlights the aspects of "blocking" that is focused on the rendering, what about the interaction input?  Let's first take a look at how one implements interactions.  For the map, a React component carries the current state of the map, and since the map is blocked from moving until the pins are loaded, pressing the zoom in/out or pan will all be the same interactions, resulting in the same result.  However, if the map navigation is nonblocking, then the React state is up to date with the interaction, so if the "left" button is pressed three times, it will move three times left.  Lastly, there is a third option to allow for new interactions while the rendering is blocked, we call this <i>logical interaction</i>, the idea is that the client maintains another separate piece of state, just for map navigation, where it can update independently of the database state, unmanaged. Then even if the loading is blocked, the interactions precede in the background, so once again, when the "left" button is pressed three times, then regardless of whether the rendering is blocked, the map will eventually move 3 to the left, instead of just one.
      </p>
      <button className="btn" onClick={this.makeLogical}>Separate interaction intention (logical interaction)</button>
      <p>
        As you can see, data dependent controls are pretty hard to reason about both for the developer and the users in the face of high latency and asynchrony, even with our framework, because the application logic is more complex.  We encourage designing with data <i>independent</i> controls.
      </p>
      <p>
        To enable streaming, we can simply insert into the <code>pinData</code> table.  We implemented an (emulated) pulling function from the server to update the pins, click the Start Streaming button under the visualization to see the effect on the visualization.  Notice how if you already have a brush there, if a new pin falls into the selected region, then the chart data is automatically updated.
      </p>
      <p>
        The relational model of interaction also makes manipulating the state of the visualization very simple.  Check out the functionalities of the buttons below the visualization to see their effect.v
      </p>
    </>
    );
  }
}