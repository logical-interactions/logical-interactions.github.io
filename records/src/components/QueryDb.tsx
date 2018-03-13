import * as React from "react";

import { db } from "../records/setup";
import { QueryResults } from "sql.js";

interface QueryDbProps {
  execute?: boolean;
  hideQuery?: boolean;
  explainTxt?: string;
  query?: string;
  buttonTxt?: string;
}

interface QueryDbState {
  query: string;
  result: QueryResults;
  queried: boolean;
}

export default class QueryDb extends React.Component<QueryDbProps, QueryDbState> {
  static defaultProps = {
    hideQuery: false,
    execute: false,
    buttonTxt: "run",
    queried: false,
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
      console.log("executed querydb at constructor time");
      result = db.exec(this.props.query)[0];
    }
    this.state = {
      query: props.query,
      result,
      queried: props.execute ? true : false,
    };
  }
  handleChange(event: any) {
    this.setState({query: event.target.value});
  }
  executeQuery() {
    let result = db.exec(this.state.query)[0];
    this.setState({
      result,
      queried: true,
    });
  }
  render() {
    let { explainTxt, buttonTxt, hideQuery } = this.props;
    let { result, query, queried } = this.state;
    let resultEle: JSX.Element;
    let explainTxtEle: JSX.Element;
    if (result) {
      // map the ts to human time
      resultEle = <table style={{fontFamily: "courier"}}>
        <thead>
          {result.columns.map(c => <th>{c}</th>)}
        </thead>
        <tbody>
          {result.values.map(r => (<tr>{r.map((c, i) => {
            let cell = result.columns[i] === "ts" ? new Date(c as number).getHours() + ":" + new Date(c as number).getMinutes() + ":" + new Date(c as number).getSeconds() : c;
            cell = ((result.columns[i].toLowerCase().indexOf("lat") > -1) || (result.columns[i].toLowerCase().indexOf("long") > -1)) ? Math.round(cell as number * 100) / 100 : cell;
            return (<td>{cell}</td>);
          })}</tr>))}
        </tbody>
      </table>;
    } else if (queried) {
      // then no result
      resultEle = <p style={{fontFamily: "courier", color: "red"}}>No result</p>;
    }
    if (explainTxt) {
      explainTxtEle = <p style={{color: "blue"}}>{explainTxt}</p>;
    }
    let queryEle = <>
      <div style={{float: "left"}}>
        <textarea value={query} onChange={this.handleChange} rows={query.split("\n").length + 1} cols={80} style={{fontFamily: "courier"}} />
      </div>
      <div style={{float: "left", paddingLeft: 10}}>
        <button className="btn" onClick={this.executeQuery}>{buttonTxt}</button>
      </div>
      <div style={{clear: "both"}}></div>
    </>;
    return (<>
      {explainTxtEle}
      {hideQuery ? null : queryEle}
      {resultEle}
    </>);
  }
}