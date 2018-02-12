import * as React from "react";

export default class GraphicalHistoryContainer extends React.Component<undefined, undefined> {
  render() {
    return (<>
      <p style={{float: "left"}}>
        There are simpler cases of interaction history as well.  Here, IMDB provides a history of the pages of movies or actors viewed.</p>
      <img style={{float: "left"}} src="media/imdb.png"></img>
    </>);
    }
}