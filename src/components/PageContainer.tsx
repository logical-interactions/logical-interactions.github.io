import * as React from "react";

import MergedContainer from "./MergedContainer";
import SingleBufferContainer from "./SingleBufferContainer";
import Scatterplot from "./Scatterplot";
import ZoomContainer from "./ZoomContainer";
import CrossfilterContainer from "./CrossfilterContainer";
import { numberArray } from "../lib/stockData";
import { getScatterData, getFlightData } from "../lib/data";

// import { Encoding, Widget, Events } from "../lib/chronicles";

interface PageContainerState {
  bufferSize: number;
  avgDelay: number;
  varDelay: number;
  encoding: string;
  ordered: boolean;
  color: string;
  disabled: boolean;
  policy: string;
  invalidate: boolean;
}

export default class PageContainer extends React.Component<undefined, PageContainerState> {
  m1: MergedContainer;
  mergedContainer: MergedContainer;

  constructor() {
    super(undefined);
    this.onChange = this.onChange.bind(this);
    this.state = {
      bufferSize: 4,
      encoding: "COLOR", // "POSITION", //
      avgDelay: 2000,
      varDelay: 1000,
      ordered: true,
      disabled: false,
      color: "BLUE", // "MULTI"
      policy: "blocking",
      invalidate: false,
    };
  }

  onChange(event: any) {
    // hack, if can be coerced into number, coerce into number
    let value = parseInt(event.target.value, 10);
    value = isNaN(value) ? event.target.value : value;
    // should also reset state
    this.setState({ [event.target.name]: value });
  }
  componentDidMount() {
    // FIXME: this is kinda tedious...
    this.m1.updateSelection("Jan");
    this.mergedContainer.updateSelection("Jan");
  }

  // onChange(event: any) {
  //   this.setState({event.target.id, event.target.value});
  // }
  render() {
    let intro = (<div><p>
      Often designers of visual analytic tools (or authoring tools like Tableau) assume that things are fast, and much effort has been put into making computation more efficient.  However it's not always possible to have guaranteed short latency, say 10 ms, or even 500ms.
      This stringent latency requirement makes a lot of visual analtyic tools either not possible to be made, or causes visualizations created to be unpleasant to use.  What's worse is that the ways that visualizations break when there is long latency is not the same.  Since developers often treat latency as a post hoc programming patch, it's not often thought of as something to even design for.
    </p>
    </div>);

    let singleBufferControl = (
      <div>
        <p>You can play with different settings here:</p>
        <div className="controls">
          <label htmlFor="policy">Design:  </label>
          <select id="policy" name="policy" className="select" value={this.state.policy} onChange={this.onChange}>
            <option value="blocking">blocking</option>
            <option value="async">async</option>
            <option value="newest">newest</option>
          </select>
          <label htmlFor="invalidate">  invalidate:  </label>
          <select id="invalidate" name="invalidate" className="select" value={this.state.invalidate.toString()} onChange={this.onChange}>
          <option value="true">true</option>
          <option value="false">false</option>
          </select>
        </div>
      </div>
    );
    let singleBufferVis = (<SingleBufferContainer
      policy={this.state.policy}
      invalidate={this.state.invalidate}
    />);
    let singleBuffer = (<div><p>
      Let's take a look at the different ways a frontend developer could program asynchronous interactions. In the following common case, after you perform an interaction that requires a long processing time, youa re not allowed to interact with anything on the screen.
    </p>
    <SingleBufferContainer
      policy={"blocking"}
      invalidate={false}
    />
    <p>
      This is annoying, what if you changed your mind and no longer want to see the result anymore? The following design allows you to intervene, and see only the most recent result.
    </p>
    <SingleBufferContainer
      policy={"newest"}
      invalidate={false}
    />
    <p>
      OK, this is a bit better perhpas. What if I just want to see all of the results as fast as possible?  Our initial hypothesis is that perhaps people can still make sense of results out of order, if the task is simple enough, such as seeing if a month's value crossed a line. Perhaps you can give it a try.
    </p>
    <SingleBufferContainer
      policy={"async"}
      invalidate={false}
    />
    <p>
      We found, through an experiment on Mechanical Turk, that people were very reluctant to experience the results arriving randomly---they just waited for the previous result to arrive.  Which got us thinking... Can there be anything that helps?
    </p>
    {singleBufferControl}
    {singleBufferVis}
    </div>
    );
    let control = (
      <div className="controls">
        <label htmlFor="encoding">Design:  </label>
        <select id="encoding" name="encoding" className="select" value={this.state.encoding} onChange={this.onChange}>
          <option value="POSITION">Multiples</option>
          <option value="COLOR">Overlay</option>
        </select>
        <label htmlFor="encoding">  Buffer Size:  </label>
        <select id="bufferSize" name="bufferSize" className="select" value={this.state.bufferSize.toString()} onChange={this.onChange}>
          <option value="1">1</option>
          <option value="4">4</option>
          <option value="8">8</option>
          <option value="12">12</option>
        </select>
        <select id="ordered" name="ordered" className="select" value={this.state.ordered.toString()} onChange={this.onChange}>
        <option value="true">ordered</option>
        <option value="false">unordered</option>
        </select>
      </div>
    );
    let vis = (
      <MergedContainer
        ref={c => this.mergedContainer = c}
        bufferSize={this.state.bufferSize}
        avgDelay={this.state.avgDelay}
        varDelay={this.state.varDelay}
        encoding={this.state.encoding}
        ordered={this.state.ordered}
        color={this.state.color}
        disabled={this.state.disabled}
      />);

    let chronicles = (<div>
      <p>
        Which is what brought us to think, what if all the results you ever see will always be on the screeen (that it's <strong>stable</strong>)? It brings the following design you see, go ahead and play with the visualization.
      </p>
      <MergedContainer
        ref={c => this.m1 = c}
        bufferSize={20}
        avgDelay={this.state.avgDelay}
        varDelay={this.state.varDelay}
        encoding={"MULTIPLES"}
        ordered={false}
        color={this.state.color}
        disabled={this.state.disabled}
      />
      <p>
        Like you hopefully have discovered (let us know if you didn't!), you didn't wait for each individual result to load, but rather interacted in parallel.  This can fit into any tasks that do not require strict order, like finding the maximum value of a month across the years, or finding out liers.
      </p>
      <p>
        It turns out that this effect persists even if you dont get to see all the results --- we limited the total number of of the results you can see and ran some experiments with mechanical turk users.
      </p>
      <MergedContainer
        ref={c => this.m1 = c}
        bufferSize={20}
        avgDelay={this.state.avgDelay}
        varDelay={this.state.varDelay}
        encoding={"MULTIPLES"}
        ordered={false}
        color={this.state.color}
        disabled={this.state.disabled}
      />
      <p>
        It turns out that there is a lot you can play around with, like how to compose the multiple resulting charts, how many past results to show, whether to order the color encodings, and so on.  For a different example in the design space, see below.  You can also play with the settings in the control bar.
      </p>
      {control}
      {vis}
      <p>
        We speculate that different corners in the design space will have different tradeoffs and should be adapted to different kinds of visualizations and tasks.  However a more pressing question on your mind at this point is probably how generalizable this design is.  We hope the following examples could illustrate how to generalize the idea---just visualize short term history and the correspondence between interaction and the corresponding results!
      </p>
    </div>);
    let moreDesignsScatter = (<p>
      Asynchronous designs could be applied to other scenarios that doesn't seem "parallelizable" immediately. See the following example of zooming on a scatter plot.
    </p>);
    let scatterData = getScatterData(numberArray);
    let scatter = (
      <ZoomContainer
        bufferSize={this.state.bufferSize}
        avgDelay={this.state.avgDelay}
        varDelay={this.state.varDelay}
        encoding={this.state.encoding}
        ordered={this.state.ordered}
        color={this.state.color}
        dataset={scatterData}
      />
    );
    let moreDesignsCrossfilter = (<p>
      Here is an example of crossfilter using chronicles.
    </p>);
    let crossfilterData = getFlightData();
    let crossfilter = (
      <CrossfilterContainer
        dataset={crossfilterData}
        avgDelay={this.state.avgDelay}
        varDelay={this.state.varDelay}
      />
    );
    let implementation = (<p>
      These designs are none trivial to implement, and require a "time-centric" way to treat the application.  We will talk about that in another article.
    </p>);
    return (
      <div>
        {intro}
        {singleBuffer}
        {chronicles}
        {moreDesignsScatter}
        {scatter}
        {moreDesignsCrossfilter}
        {crossfilter}
      </div>
    );
  }
}