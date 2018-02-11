import * as React from "react";

import Model from "./Model";

export default class PageContainer extends React.Component<undefined, undefined> {
  render() {
  return (<>
    <h2>Life of an Interaction</h2>
    <p>
      Not all interactions are created equal.  When we interact with an object, say, picking up a pen, there is immediate feedback and immediate consequences.  The interaction with the pen was instantaneous.  Sometimes we can also interact with objects that are slow, for instance controlling the rudder of a boat.  Fortunately, the rules of physics are fixed, and through practice, we learn how to work with them.  However, when we interact with a computer interface, all bets are off.  The widget could not respond to your clicks; the widget could move slightly after your initial instructions, the results might show up sometime after your initial mouse events, there may be a spinner (but you don't know what it's referring to.  The list goes on.</p>
    <p>
      One "solution" is to make things fast—faster rendering, faster network, faster data processing.  However, we like to add features as well—larger data volume, fancier algorithms, larger screens, more business logic.  Point being, we are not likely to ever do away with some form of slowness.  So we should take some time(!) to understand what’s going on.  Now we discuss a simple model that could make computer interactions a bit more like controlling a rudder, than throwing a dice.</p>
    <h2>The Model</h2>
    <p>
      In order to create designs to make sense of asynchrony, we created the following model:
    </p>
    <Model
      width={500}
      height={500}
    />
    </>);
  }
}