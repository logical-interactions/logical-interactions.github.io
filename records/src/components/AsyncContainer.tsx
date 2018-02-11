import * as React from "react";

import MapZoom from "./MapZoom";
export default class PageContainer extends React.Component<undefined, undefined> {
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

    let consistency = (<>
      <h2>Consistency: Taming the Wild</h2>
      <p>
        that we can design <i>with</i> asynchrony.  Currently, the most common practice is to block so that the response and requests are aligned in time, but one could also imagine many other designs where the correspondence is not serialized and matched through other means.
      </p>
      <h3>A Visualization Example</h3>
      <p>
        While there are consistency models in databases, it doesn't directly translate to the UI (we <a href="http://people.eecs.berkeley.edu/~yifanwu/assets/devil.pdf">tried</a>!).  Let's take a look at an example</p>
      <MapZoom
      />
      <h3>A Control Example</h3>
    </>);

    return (<>
      {consistency}
    </>);
  }
}