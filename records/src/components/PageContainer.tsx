import * as React from "react";

import Model from "./Model";
import MapZoom from "./MapZoom";

export default class PageContainer extends React.Component<undefined, undefined> {
  render() {
    let intro = (<>
      <h1>How to Create an UX aware of History and Context</h1>
      <h3 style={{textAlign: "right", lineHeight: "70%"}}>Or, How to Time Travel Safely</h3>
      <h2>Life of an Interaction</h2>
      <p>Not all interactions are created equal.  When we interact with an object, say, picking up a pen, there is immediate feedback and immediate consequences.  The interaction with the pen was instantaneous.  Sometimes we can also interact with objects that are slow, for instance controlling the rudder of a boat.  Fortunately, the rules of physics are fixed, and through practice, we learn how to work with them.  However, when we interact with a computer interface, all bets are off.  The widget could not respond to your clicks; the widget could move slightly after your initial instructions, the results might show up sometime after your initial mouse events, there may be a spinner (but you don't know what it's referring to.  The list goes on.</p>
      <p>One "solution" is to make things fast—faster rendering, faster network, faster data processing.  However, we like to add features as well—larger data volume, fancier algorithms, larger screens, more business logic.  Point being, we are not likely to ever do away with some form of slowness.  So we should take some time(!) to understand what’s going on.  Now we discuss a simple model that could make computer interactions a bit more like controlling a rudder, than throwing a dice.</p>
      <h2>Bad Interactions</h2>
      <div className="indent">
        <h3>The hard to read</h3>
        <i>"Did it get it?", "Should I click again?", "What's happening?"</i>
        <h3>The confusing</h3>
        <h3>The Mistake</h3>
        This viral <a href="https://gfycat.com/QueasyGrandIriomotecat">humorous gif</a> about the not so funny missile alert show cases what happens when <b>human latency</b> is ignored.
        <video controls>
          <source src="media/misslewarning.webm" type="video/webm"/>
          {/* ;codecs=\"vp8, vorbis\" */}
        </video>
        <p>
          Even though to the computer you are clicking on the object it has rendered, humans have roughly <b>200 miliseconds</b> delay between deciding in the head and actually executing the click.  How to fix this kind of errors? It is clear that we cannot predict the future. However the developer must have a way of knowing the past version that the user was interacting with.
        </p>
        </div>
      </>);
    let model = (<>
      <h2>The Model</h2>
      <p>In order to create designs to make sense of asynchrony, we created the following model:</p>
      <Model
        width={500}
        height={500}
      />
      <h3>How does this work with the MVVM models</h3>
      <p><a href="https://msdn.microsoft.com/en-us/library/hh848246.aspx">MVVM</a> is yet another architecture proposed by Microsoft a few years ago.  We mostly work with the view model layer, where most of the state management happens.</p>
      <p>Of course, we are not the first to come up with a event oriented way of programming the UI.  <a href="https://martinfowler.com/eaaDev/EventSourcing.html">Martin Fowler</a>.  However,using history has not been extensively integrated into UX designs, as we demonstrate next, there is a gallery of existing and potential designs that are enabled by this pattern.  It does not require a special library, but a library could help with some of the common patterns.</p>
      </>
    );
    return (<>
      {intro}
      {model}
      <h2>Throttling and Caching</h2>
      <h2>Undo/Redo, Logging</h2>
      <h3>Interaction History</h3>
      <p>Jupyter Notebooks are wildly popular, and one of the reasons is that just as real notebooks, we tend to save previous results. This can help us think better (see literature in distributed cognition).</p>
      <p>There are simpler cases of interaction history as well</p>
      <img src="media/imdb.png"></img>
      <h2>Consistency</h2>
      <p>
        that we can design <i>with</i> asynchrony.  Currently, the most common practice is to block so that the response and requests are aligned in time, but one could also imagine many other designs where the correspondence is not serialized and matched through other means.
      </p>
      <h3>A Visualization Example</h3>
      <p>While there are consistency models in databases, it doesn't directly translate to the UI (we <a href="http://people.eecs.berkeley.edu/~yifanwu/assets/devil.pdf">tried</a>!).  Let's take a look at an example</p>
      <MapZoom
      />
      <h3>A Control Example</h3>
      <h2 id="r4">Introducing the R4 API</h2>
      <p>R4 is for inte<b>r</b>act, <b>r</b>equest, <b>r</b>esponse, and the <b>r</b>ender for all three.  The idea is to wrap the developers' functions into the model's four r's, and then apply higher level policies <i>declaratively</i>.  Some were already discussed before in the model section.</p>
      <p>You can think of </p>
    </>);
  }
}