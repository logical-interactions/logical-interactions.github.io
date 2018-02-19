import * as React from "react";

export default class LibraryContainer extends React.Component<undefined, undefined> {
  render() {
    return(<>
      <h2 id="r4">Introducing the Records API</h2>
      <p>
        State management is already getting a bit tricky for fronend developers, including history is like managing state on steroids.  The example earlier with the map illustrates a principle way to implment history.  Here we provide a simple wrapper library to simplify the boilerplate logic.  Additionally, using React (naively) without optimizing (and more extensive of the inner workings of the library) would lead to a lot of wasted updates.  This library manages state independent of React and using the stricter semantics of the itneraction history can probide more efficient updates to the react state.  Besides, we also have more control over the exact asynchrony behavior, which might not be guaranteed in React.  Additionally, React's hierachical structure makes it harder to communicate effectively information between dependent interactions, and Redux's flat structure is too much in the other extreme.
      </p>
      <p>
        The idea is to wrap the developers' functions into the model, and then apply higher level policies <i>declaratively</i>, either predefined by our library, or by custom user functions over the history.  Much like other libraries (e.g., <a href="https://egghead.io/lessons/react-redux-implementing-store-from-scratch">Redux</a>), this is a simple idea and the code is not complex code, but nudges developers to think of their application in different ways.</p>
      <p>You can think of </p>

      <h3>How does this work with the MVVM models</h3>
      <p>
        <a href="https://msdn.microsoft.com/en-us/library/hh848246.aspx">MVVM</a> is yet another architecture proposed by Microsoft a few years ago.  We mostly work with the view model layer, where most of the state management happens.</p>
      <p>
        Thinking about history making logical decisions is different from eventflows.  Again, as a human, when someone passes us the salt, the first thing that comes to mind is not the original question that asked for the salt, but more like whether the salt is needed for the task at hand.  </p>
      <p>
        Of course, we are not the first to come up with a event oriented way of programming the UI.  <a href="https://martinfowler.com/eaaDev/EventSourcing.html">Martin Fowler</a>.  However,using history has not been extensively integrated into UX designs, as we demonstrate next, there is a gallery of existing and potential designs that are enabled by this pattern.  It does not require a special library, but a library could help with some of the common patterns.</p>
      <p>
        The current implementation uses <a href="https://reactjs.org/docs/react-component.html#forceupdate">forceUpdate</a>, like mobX (interestingly, not Redux).
      </p>
    </>);
  }
}