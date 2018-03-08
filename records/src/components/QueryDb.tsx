import * as React from "react";

import { db } from "../records/setup";
import { QueryResults } from "sql.js";

interface QueryDbProps {
  query?: string;
}

interface QueryDbState {
  query: string;
  result: QueryResults;
}

export default class QueryDb extends React.Component<QueryDbProps, QueryDbState> {
  constructor(props: QueryDbProps) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      query: props.query,
      result: null,
    };
  }
  handleChange(event: any) {
    this.setState({query: event.target.value});
  }
  executeQuery() {
    let r = db.exec(this.state.query);
  }
  render() {
    let { result } = this.state;
    let resultEle: JSX.Element;
    if (result) {
      resultEle = <>
        <thead>
          {result.columns.map(c => <th>{c}</th>)}
        </thead>
        <tbody>
          {result.values.map(r => <tr>{r.map(c => (<td>c</td>))}</tr>)}
        </tbody>
      </>;
    }
    return (<>
      <input type="text" value={this.state.query} onChange={this.handleChange} />
      <button onClick={this.executeQuery}>Run</button>
      {resultEle}
    </>);
  }
}