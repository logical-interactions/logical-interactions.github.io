import * as React from "react";
import * as d3 from "d3";

import { db } from "../sql/setup";

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

    let headersTr = <tr>headers.map(c => <td>c</td>)</tr>;
    let table = records.map(r => <tr>{r.map(c => <td>c</td>)}</tr>);

    return <table>
        {headersTr}
        {table}
      </table>;
  }
}