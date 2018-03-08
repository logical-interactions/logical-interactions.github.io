import * as React from "react";

import QueryDb from "./QueryDb";
import MapZoomContainer from "./MapZoomContainer";
import { toggleStreaming } from "../lib/streamingPins";



interface MapZoomExplainState {
  showScent: boolean;
  streaming: boolean;
}

export default class MapZoomExplain extends React.Component<undefined, MapZoomExplainState> {
  constructor(props: undefined) {
    super(props);
    this.handleStreaming = this.handleStreaming.bind(this);
    this.state = {
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
      <p>What is the framework we used to make that happen? First, there are two user initiated interactions: (1) isv.</p>
      <p>
        To enable streaming, we can simply insert into the <code>pinData</code> table.  We implemented an (emulated) pulling function from the server to update the pins, click to see the effect on the visualization.
      </p>
      <button onClick={this.handleStreaming}>{this.state.streaming ? "Pause" : "Start"} Streaming </button>
      <p>
        The astute reader might point out that this is the simple case of streaming, where the mapping from pixel space to data space (the scale) of the interaction input is not affected by the streaming data. The framework offers a few declarative solutions.  One is whenever an interaction starts (note not necessarily rendered), freeze the current state of the UI and disallow new streamed in data to update, until the user is done with the interaction and expresses a wish to continue, releasing the "lock" on the screen.  Another option is that since interactions are specified in data space, we are guaranteed to have the correct visualization of input, so the streaming updates the screen, but also updates the interaction's pixel mapping.  If the scenario is such that the selection is dependent on <b>time</b>, we recommend the first solution, and the if the interaction is only dependnet on the scale and the scale doesn't change much, the second option could offer more "real time" exerpience. #TODO: implement two quick examples.v</p>
    </>);
  }
}