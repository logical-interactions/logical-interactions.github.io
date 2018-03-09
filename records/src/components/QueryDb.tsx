import * as React from "react";

import { db } from "../records/setup";
import { QueryResults } from "sql.js";

interface QueryDbProps {
  execute?: boolean;
  hideQuery?: boolean;
  explainTxt?: string;
  query?: string;
}

interface QueryDbState {
  query: string;
  result: QueryResults;
}

export default class QueryDb extends React.Component<QueryDbProps, QueryDbState> {
  static defaultProps = {
    hideQuery: false,
    execute: false,
  };
  constructor(props: QueryDbProps) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.executeQuery = this.executeQuery.bind(this);
    let result = null;
    console.log("DEBUG, [QueryDb]", props.query);
    if (props.execute) {
      if (!this.props.query) {
        throw new Error("Automatically executing QueryDB should have predefined query");
      }
      result = db.exec(this.props.query)[0];
    }
    this.state = {
      query: props.query,
      result,
    };
  }
  handleChange(event: any) {
    this.setState({query: event.target.value});
  }
  executeQuery() {
    let result = db.exec(this.state.query)[0];
    this.setState({result});
  }
  render() {
    let { explainTxt } = this.props;
    let { result, query } = this.state;
    let resultEle: JSX.Element;
    let explainTxtEle: JSX.Element;
    if (result) {
      resultEle = <table style={{fontFamily: "courier"}}>
        <thead>
          {result.columns.map(c => <th>{c}</th>)}
        </thead>
        <tbody>
          {result.values.map(r => <tr>{r.map(c => (<td>{c}</td>))}</tr>)}
        </tbody>
      </table>;
    }
    if (explainTxt) {
      explainTxtEle = <p style={{color: "blue"}}>{explainTxt}</p>;
    }
    return (<>
      {explainTxtEle}
      <textarea value={query} onChange={this.handleChange} rows={query.split("\n").length + 1} cols={80} style={{fontFamily: "courier"}} />
      <br/>
      <button onClick={this.executeQuery}>Run</button>
      {resultEle}
    </>);
  }
}