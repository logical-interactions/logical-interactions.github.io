import * as React from "react";
import * as d3 from "d3";

import { db } from "../sql/setup";
import { getFormattedTime } from "../lib/helper";

interface TableViewProps {
  headers: string[];
}

interface TableViewState {
  records: any[][];
}

export default class TableView extends React.Component<TableViewProps, TableViewState> {
  constructor(props: TableViewProps) {
    super(props);
    this.setTableViewValues = this.setTableViewValues.bind(this);
    this.state = {
      records: null,
    };
  }

  setTableViewValues(records: any[][]) {
    this.setState({records});
  }

  render() {
    let { headers } = this.props;
    let { records } = this.state;

    let ele: JSX.Element = null;
    if (records) {
      let headersTr = <tr>{headers.map(c => <td>{c}</td>)}</tr>;
      let table = records.map(r => <tr>{r.map((c, i) => {
        if (i === 0) {
          // we know this is time
          return <td>{getFormattedTime(c)}</td>;
        } else if (i === 1) {
          // we know this is a real value
          return <td>{Math.round(c)}</td>;
        }
        return <td>{c}</td>;
      })}</tr>);
      ele = <table>
        {headersTr}
        {table}
      </table>;
    }

    return <div padding-top={30}>{ele}</div>;
  }
}