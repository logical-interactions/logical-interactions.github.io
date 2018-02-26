import * as React from "react";

import Model from "./Model";

import MapZoom from "./MapZoom";

export const ModelContainer = () => {
  return (<>

    <h2>Life of an Interaction</h2>
    <p>
      Interactions with graphical interfaces are an essential part of how we use data and computations.  As the power of what we can do on user interfaces increase, they are getting increasingly sophisticated.  In one sense, interactions are the logic of state mutation.  We first talk about how interactions can be mapped to state changes, and how we might want a more <i>relational</i> way to look at state dependencies, and then we will talk about what <i>asynchronoy</i> does to state management, and how thinking about histories can provide a clean abstraction to reason with.  We end with how history and the relational perspective of state management could in itself be an interesting way to think about UX, beyond dealing with concurrency and asynchrony.
    </p>
    <h3>State Dependencies</h3>
    <p>
      In "traditional" applications, users simply just click on a button, and the button immediately does something, such as setting the value of the text of a div. All is well.  In complex applications, people could be interacting with the state that is the result of some other interactions.  For instance in the following example, after zoom, the user can brush on the map to select more information about the pins on the map. Now if the user moves the map, either the brush moves with the map, or the brush is cleared, or the brush remains and the data of the brush updates. In all these cases, there is an inherent connection between the state of the map and the state of the brush. Now, most of you would find the implementation of a solution obvious.  Just listen to the event and remove the brush and the corresponding chart. What about the other two, valid, options? Slightly more complicated but doable. And if we start designing more complex applications with more moving pieces, it might start being more dangerous, and the code might be harder to maintain (TODO: back up this argument by writing pseudocode!).
    </p>
    NOTE: do the map zoom without latency! : )
    {/* <MapZoom
    /> */}
    <h3 className="insight">Relational Tables</h3>
    <p>

    </p>
    <h3>Asynchrony</h3>
    <p>
      Asynchrony happens in nature as well. When we interact with an object, say, picking up a pen, there is immediate feedback and immediate consequences.  The interaction with the pen was instantaneous.  Sometimes we can also interact with objects that are slow, for instance controlling the rudder of a boat.  Fortunately, the rules of physics are fixed, and through practice, we learn how to work with them.  However, when we interact with a computer interface, all bets are off.  The widget could not respond to your clicks; the widget could move slightly after your initial instructions, the results might show up sometime after your initial mouse events, there may be a spinner (but you don't know what it's referring to.  The list goes on.</p>
    <p>
      One "solution" is to make things fast: faster rendering, faster network, faster data processing.  However, we like to add features as well: larger data volume, fancier algorithms, larger screens, more business logic.  Point being, we are not likely to ever do away with some form of slowness.  So we should take some time(!) to understand what’s going on.
    </p>
    <p>
      Current solutions mostly involve some form of blocking: the usual giant spinner on the entire page with the background grayed out.</p>
    <p>
      Often, however, blocking is not desirable.  Some chat clients allow users to type in a message even if the network is currently down, with the design goals of sending these messages in at a later time.  Or, sometimes in search results, we can click on another link that seems to be a better fit while the previous link we clicked on seems to be taking a while to load. Or, in the case of a command-click, the page opens in a new tab concurrently.
    </p>
    <p>
      There is no silver bullet for asynchrony --- having a clear model to implement desirable behavior is probably the best we can get.  Take the following simple example of chat message client.  There was an earlier message that still has a spinner on it, meaning it failed to send. Should the message be sent, will it show up as sent now, or sent earlier? The design decision might have different implications.  Choosing to insert it as sent now might confuse the receiver if the context is no longer relevant, and choosing to insert it as sent earlier might violate history and cause confusion of the use missing either the message.
    </p>
    <img src="chat_screenshot.png"/>

    <p>
      Furthermore, not only is blocking often not desirable, it can be executed incorrectly.  Take a look at the following clip of a spreadsheet like application entering data.  You can see a subtle delay between entering the data and seeing the result.
    </p>
    <img src="media/async_enter.gif"></img>
    <p>
      While it's easy to get used to this, the same underlying issue might cause a more problematic case, as shown below, where I'm entering "1", "enter", "down", on repeat.  You see that the cursor was actually reset in a few cases, leaving the cells to be empty or in some cases with 11.</p>
    <img src="media/async_fast_enter.gif"></img>
    <p>
    <p>
      This viral <a href="https://gfycat.com/QueasyGrandIriomotecat">humorous gif</a> about the not so funny missile alert show cases what happens when <b>human latency</b> is ignored.</p>
    <video controls>
      <source src="media/misslewarning.webm" type="video/webm"/>
    </video>
    <p>
      Even though to the computer you are clicking on the object it has rendered, humans have roughly <b>200 miliseconds</b> delay between deciding in the head and actually executing the click.  How to fix this kind of errors? It is clear that we cannot predict the future. However the developer must have a way of knowing the past version that the user was interacting with.
    </p>
    </p>
    <h2>The Model</h2>
    <p>
      Interactions can be modeled as defining a state of a component (e.g. a chart).  For instance, the fact that the underlying data to define the view is not there is just some constraints we have to deal with (the response could trigger a re-evaluation of the interaction).  The only tricky issue is that sometimes the view definitions depends not just on user inputs but also the data fetching effects. We may choose for an interaction to render ("committed") if the response comes back, and this cannot be decided solely based on the interaction sequence. Once the interaction is committed, then the current interactions will be reading results from that committed interaction. However, if there are no newer interactions, then the zoom could continue.
    </p>
    <p>
      This can be done by changing the value of the state.  Often, it's assumed that widgets can only be changed by the user. This is not true, as it can be changed by the asynchronously loading response, dependencies on other components, and potentially server state/real-time streaming data.
    </p>
    <h3>Pending state</h3>
    <p>
      Logical vs "physical" updates.  When we perform state dependent interactions, such as zooming a map.  We essentially want logical updates (note that this is similar to React's lifecycle, where in order to ensure that tstate changes are indeed based on a previously updated state, since React could batch process state updates for performance, you do (prevState)=> {`{newState}`}). In order to implement undo --- we simply just go to the previous phsyical update, which is persisted.
    </p>
    <p>
      This model subsumes many cases, including the <b>client vs. Server State</b>. When the client is also writing to the server, for instance, in the previous messaging example, the client has a fast local state, and the server has a slow server state.  Making the client completely mapped to server state would confuse the user's part, of not knowing what happened to the message that was sent.  This is subsumed by our model, where the interaction should have "immediate" feedback, waiting for some more data to be fetched.  Rendering delay can also be captured as a component state, and be treated the same way as an asynchronous request to the server.
    </p>
    <h3>Correspondence and Dependencies</h3>
    <p>
      These are the only two additional concepts we need to introduce to reason about asynchrony.
    </p>
    <p>
      How to capture animation? This problem has been faced by the React community, and they can exist outside of the state manager.
    </p>
    <h3>Example</h3>
    <p>
      Let's take our previous example of the map. Here, we have 4 components: (1) the underlying map (2) pins, (3) brush, and (4) the chart.  They have the following relations: the pins are coordinated with the map, the brush is coordinated with the pins/map, and the chart is coordinated with the brush.
    </p>
    <p>
      When the data fetch is received, it triggers a reevaluation of the view, and the view is over the history of past events.  This would be expensive to run, e.g., for a hover to show value event to reevaluate the entire view. So the engine intelligently computes the component states that has changed, using relational algebra (materialized views).  The only point of coordination we need is that the VIEWs are evaluated atomically.
    </p>
    <p>
      One example interaction sequence: (1) zoom (2) zoom (3) render zoom 1 (4) brush, now render zoom 2 arrives. If we are to take the most recent interaction as priority, i.e. the brush, then the view should keep the zoom 1 as the current view.  If, however, the interaction sequence was (1) zoom (2) zoom (3) render zoom 1, then the new zoom 2 would be rendered.
    </p>
    <h3>Benefits</h3>
    <p>
      It's one thing to create UX that is pleasant and intuitive, which requires designing, but at the very basic we can ensure that there is no incorrect state -- by which we mean, if anyone who knows how the interface works were to take a look at the snapshot, no wrong information could be derived --- this can be achieved by guaranteeing the correspondence across the components.
    </p>
    <h3>Transactions</h3>
    <p>
      Databases have a notion of "serializability," where transactions are equivalent to any order. This prevents the database to end up in bad cases. With the classic example being the bank withdraw (TODO: add example).  For a UI, if there are two asynchronous updates that conflict, make sure that they are not interleaved.  This might happen when there is some local client state, and there is some server state, and the user updates the client state, and the server attempts to update the client state for synchronization.  User intent might be lost in the process.  This is because when a transaction is reading the database automatically prevents conflicting data from being written.  What happens, say, if we are writing to the
    </p>
    <h3>The World Outside</h3>
    <p>
      The model presents a very simple, clean model of the world of state.  Besides state management, the UI does many things. For instance, how to map the state to the pixels (look at all the useful mappings in the D3 library!), and
    </p>
    <h3>Is this really a problem?</h3>
    <p>
      Granted, we are dealing with outlier ultra complex UXs.  However, we think application logic like this will only begin to increase as we have more "human in the loop" user interfaces.
    </p>
    </>);
};