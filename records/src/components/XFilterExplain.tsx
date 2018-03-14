import * as React from "react";

import QueryDb from "./QueryDb";

import XFilterContainer from "./XFilterContainer";

interface XFilterExplainState {

}

export default class XFilterExplain extends React.Component<undefined, XFilterExplainState> {

  render() {
    return (<>
      <h2>
        Crossfilter Example
      </h2>
      <p>
        This is on implementation of a crossfilter visualization. Crossfilers may have originated from a paper called <a href="http://ieeexplore.ieee.org/abstract/document/5204083/">Cross-Filtered Views for Multidimensional Visual Analysis</a> by Chris Weaver. The more popular, modern implementation is with Square <a href="http://square.github.io/crossfilter/">here</a>. This visualization is meant to help with identifying patterns in multi-dimentional data.  The design we have is slightly different from the Square one and closer to the original Weaver designs.  As you can see, the original distributions are fixed, and the filtered values are plotted on top.  While this gives context to the filtered versus original data, it can be difficult to read when the values differ too much.  So we added the zoom in option, if you <b>scroll</b> on the chart. The Square implementation destructively updates the other views, denormalizing the scales based on the filtered data.
      </p>
      <p>
        While the map example is focused on demonstrating how the relational model of interactions help with managing state in the face of concurrency, the crossfilter example is to show case the power of using queries to express interactions. Below is a figure from the paper mentioned earlier, 0
      </p>
      <img src="media/weaver_xfilter.png"/>
      <XFilterContainer />
      <p>
        This simple visualization you see here actually has a lot of rather complicated implementations. Take the original <a href="https://github.com/square/crossfilter">crossfilter.js</a>, which has great engineering and all the data operators are custom build, running at around 1400 lines of code, where as our implementation used about 250 lines, though based on a database implementation that's many many lines more!
      </p>
      <p>
        We actually have the asynchronous version that talks to a SQL backend (or worker, both considered asynchronous remotes), and compared with <a href="https://github.com/mapd/mapd-crossfilter">the source code of MapD's asynchronous crossfilter</a>, ours offer a much simpler way to model the interaction and asscociated processes. d
      </p>
    </>);
  }
}