import * as React from "react";

import QueryDb from "./QueryDb";

import XFilterContainer from "./XFilterContainer";

interface XFilterExplainState {

}

export default class XFilterExplain extends React.Component<undefined, XFilterExplainState> {

  render() {
    return (<>
      <XFilterContainer />
    </>);
  }
}