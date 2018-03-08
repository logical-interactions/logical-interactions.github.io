import * as React from "react";

export const GraphicalHistoryContainer = () => (<>
  <p style={{float: "left"}}>
    There are simpler cases of interaction history as well.  Here, IMDB provides a history of the pages of movies or actors viewed.</p>
  <img style={{float: "left"}} src="media/imdb.png"></img>
  <p>
    What would this look like for the two visualizations you just played around with? Now assuming that you have played around with them a bit, here are the information we have about your interactions.
  </p>
  <p>
    We can begin by some simple analysis. Perhaps you want to take a look at the latency distribution that users experience. To analyze this session, we can run the following code.
  </p>
  <p>
    For crossfilter, we know the hours, distances, and delays you looked at.  One way to visualize history is to show you all the charts you have expressed.  We'll limit it to the last 10 for the demo's purpose. Note that here it's not reactively bound yet, but you can execute a command to link the interactions together.
  </p>
  <pre><code>
    
  </code></pre>
</>);