import * as React from "react";


export default class PageContainer extends React.Component<undefined, undefined> {
  render() {
    return (<>
      <h1>The Saga of Frontend State</h1>
      <p>
        In the bad old days, the UI state is simple---it barely has any. Everything you would possibly need is in the HTML, and some functions. It's <i>stateless</i>. Now, we have dozens of libraries just for managing frontend state, such as <a href="https://github.com/reactjs/redux">redux</a>, <a href="https://github.com/mobxjs/mobx">mobx</a>, and <a href="https://github.com/cyclejs/cyclejs">cycle.js</a>.  Here we give a brief overview to get a sense of what the problem and solution space is like.
      </p>
      <p>  
      </p>
      <p>
        People seem to suggest that there are tradeoffs.
      </p>
      <p className="quote">
        So, in summary, when should you use stream libraries over MobX? Answer: when time or history plays an important role.
      </p>
      <p>One emerging message seems to be that events and state are tightly connected. Martin Flower, a highly regarded software architect, discussed the pattern of <a href="https://martinfowler.com/eaaDev/EventSourcing.html">Event Sourcing</a> (all the way back in 2005!!), where he talks about the need to know the history of an application</p> 
      <p className="quote">
        We can query an application's state to find out the current state of the world, and this answers many questions. However there are times when we don't just want to see where we are, we also want to know how we got there.
      </p>
      <p>How to achieve this? <i>every change to the state of an application is captured in an event object, and that these event objects are themselves stored in the sequence they were applied for the same lifetime as the application state itself</i>.  Similar ideas of having time as a primary component has also been pioneered in <a href="http://equis.cs.queensu.ca/~equis/pubs/2011/savery-cscw-11.pdf">collaborative groupware research</a>---for instance, to animate the change of state of a remote collaborator is more intuitive than jumping the state directly to the most recent.  And that, requires some basic time traveling, and answering "how did I get here?"</p>
      <h2>The Dao of Databases</h2>
      <p>Database is all about state management. Events, logs, data, same deal. Databases are important to use because it helps organizations persist structured information, upon which queries may transform basic information into knowledge.</p>
      <p></p>
      <p>Visualizations are a particularly good fit because </p>
      <p className="quote">
        Yes, how many js libraries will it take till they know
        That state is shared by user and machine?
        The answer, my friend, is blowing in the wind
        The answer is blowing in the wind
      </p>
    </>);
  }
}