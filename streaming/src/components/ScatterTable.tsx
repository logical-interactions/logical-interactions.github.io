import * as React from "react";
import * as d3 from "d3";

import { db } from "../sql/setup";
import { getFormattedTime } from "../lib/helper";

interface ScatterTableProps {
  headers: string[];
}

interface ScatterTableState {
  records: any[][];
}

export default class ScatterTable extends React.Component<ScatterTableProps, ScatterTableState> {
  constructor(props: ScatterTableProps) {
    super(props);
    this.setScatterTableValues = this.setScatterTableValues.bind(this);
    this.state = {
      records: null,
    };
  }

  setScatterTableValues(records: any[][]) {
    this.setState({records});
  }

  render() {
    let { headers } = this.props;
    let { records } = this.state;

    let ele: JSX.Element = null;
    if (records) {
      let headersTr = <thead><tr>{headers.map(c => <th scope="col">{c}</th>)}</tr></thead>;
      let table = records.map(r => <tr>{r.map((c, i) => {
        if (i === 0) {
          // we know this is time
          return <th scope="row">{getFormattedTime(c)}</th>;
        } else if (i === 2) {
          // we know this is a real value
          return <td>{Math.round(c)}</td>;
        }
        return <td>{c}</td>;
      })}</tr>);
      ele = <table className="table">
        {headersTr}
        <tbody>
          {table}
        </tbody>
      </table>;
    }

    return <div style={{padding: 30, width: 700}}>{ele}</div>;
  }
}