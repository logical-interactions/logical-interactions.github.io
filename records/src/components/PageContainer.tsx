import * as React from "react";

import StressTest from "./StressTest";
import MapZoomExplain from "./MapZoomExplain";
import XFilterExplain from "./XFilterExplain";
import { SvgSpinner } from "./SvgSpinner";
  // let applications = (<>
  //   <h2>Throttling and Caching</h2>
  //   <h2>Undo/Redo, Logging</h2>
  //   <h3>Scenting</h3>
  //   <h3>Notebook</h3>
  //   <p>Jupyter Notebooks are wildly popular, and one of the reasons is that just as real notebooks, we tend to save previous results. This can help us think better (see literature in distributed cognition).</p>
  // </>);
export const PageContainer = () => (<>
  <h1>Programming Asynchronous Interactions: History of Intentions</h1>
  <h3 style={{textAlign: "right", lineHeight: "70%"}}>Let's Make (UI) History!</h3>
  <p>
    Interactive visualizations is a great tool for working with data with lower cognitive overhead.  However creating a custom interactive visualization for datasets that cannot fit on a browser is very complicated, where heavily customized code seems the only option. Take <a href=" https://github.com/mapd/mapd-crossfilter/blob/master/src/mapd-crossfilter.js ">MapD's asynchronous crossfilter that talks to their relational backend</a> as an example---it's complex.  While recently there has been much work on how to make static visualization (<a href="http://ggplot2.org/">ggplot2</a>, <a href="https://www.highcharts.com/">Highcharts</a>, <a href="https://seaborn.pydata.org/">Seaborn</a>), and interactive visualizations (the amazing <a>d3</a>) easier to program, there are few that enables custom implementation for interactions that talks to backends.  <a href="https://www.tableau.com/">Tableau</a> is an amazing interactive tool that talks to backends, but it is a fixed authoring environment. Beyond the complexity of expressing the query, doing it in time/space efficient manners, that deal with asynchrony is even harder.   Asynchrony is increasingly an realitym, startups like MapD and Graphistry enable extensive analyitics that talks constatnly with the backeneds.  In addition, as we incorporate more complex processing mechanisms, such as <a href="https://codepen.io/btholt/pen/JMwQYg">using a "cognitive service" API to process speech as input to the UI </a>.  This post is about <b>taming the complexity of creating data-processing interactions frontend applications</b>.
  </p>
  <h2>
  </h2>
  <p>
  </p>
  <p>
    We will walk through two main examples to illustrate how the framework is applied. The first example focues on asynchrony, and the second example focuses on the expressiveness and simplicity of using SQL to drive interactions.f
  </p>
  <MapZoomExplain
  />
  <XFilterExplain
  />
  <p>
    Of course, using sql.js is a lot of Javascript (a whopping 2.7 MB!), and initiating the first query takes over a second, furthermore, since SQLite does not offer materialized views, many of the queries need to be recomputed and may be inefficient, at least compared to custom implementations.  However none of these are fundamental limiations.  In fact, there are a lot of techniques we could borrow from database research, such as materialized views, to make things faster, and PL techniques to potentially compile the operators down to a small set of code and prune out the unessary code and related logic (e.g. get rid of index managing code if we are not going to be using indices, as an example).
  </p>
  <p>
    To sum, our primary insight is that often, interactions can be mapped to queries over the original and derived data tables in the sequence of user itneractions.  Using relational algebra, we can declratively reason about the underlying data and the user interaction history to better express the interaction itself, manage caching, get fairly efficient implementations with low overhead, and deal with asynchrony,
  </p>

  {/* <Test /> */}
  {/* <StressTest /> */}
</>);