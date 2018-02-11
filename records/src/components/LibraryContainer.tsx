import * as React from "react";


export default class PageContainer extends React.Component<undefined, undefined> {
  render() {
    return(<>
      <h2 id="r4">Introducing the Records API</h2>
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
    </>);
  }
}