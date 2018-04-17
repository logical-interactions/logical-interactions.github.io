import * as React from "react";

import { Indicator } from "./Indicator";
import XFilterChart from "./XFilterChart";
import { db } from "../records/setup";
import { parseChartData, setupXFilterDB, XFILTERCHARTS, initialStateSQL, getXFilterChroniclesSQL } from "../records/XFilter/setup";

interface XFilterContainerState {
  baseData: {[index: string]: {x: number, y: number}[]};
  data: {[index: string]: {[index: string]: {x: number, y: number}[]}};
  pending: boolean;
  bufferSize: number;
  itxIdSet: number[];
  additionalLatency: number;
}

export default class XFilterContainer extends React.Component<undefined, XFilterContainerState> {
  constructor(props: undefined) {
    super(props);
    this.refreshXFilterData = this.refreshXFilterData.bind(this);
    this.setPending = this.setPending.bind(this);
    this.changeBuffer = this.changeBuffer.bind(this);
    setupXFilterDB();
    db.create_function("refreshXFilter", this.refreshXFilterData);
    db.create_function("setXFilterPending", this.setPending);
    let t = +new Date();
    db.exec(`
      INSERT INTO xBrushItx (ts, chart) VALUES ${XFILTERCHARTS.map((v) => `(${t}, '${v}')`).join(", ")};
    `);
    this.state = {
      baseData: null,
      data: null,
      itxIdSet: [],
      pending: true,
      additionalLatency: 0,
      bufferSize: 1,
    };
  }

  refreshXFilterData() {
    if (!this.state.baseData) {
      // try fetching itgroup_concat
      let baseRes = db.exec(initialStateSQL);
      let baseDataR = parseChartData(baseRes);
      if (baseDataR.data) {
        if (Object.keys(baseDataR.data).length !== 1) {
          throw new Error("Basedata result should be exactly 1");
        }
        let itxId = Object.keys(baseDataR.data)[0];
        db.exec(`INSERT INTO xFilterRender (itxId, ts) VALUES (${itxId}, ${+new Date()})`);
        this.setState({
          baseData: baseDataR.data[itxId],
        });
      }
    }
    let query = getXFilterChroniclesSQL(this.state.bufferSize);
    let res = db.exec(query);
    let dataR = parseChartData(res);
    if (dataR.data) {
      // FIXME the pending right now is too coarse grained
      let pending = false;
      let maxItxId = Math.max(...Object.keys(dataR.data).map(v => parseInt(v, 10)));
      db.exec(`INSERT INTO xFilterRender (itxId, ts) VALUES (${maxItxId}, ${+new Date()})`);
      console.log("for xFitlerRend, we have the id", maxItxId, "and values", dataR.data);
      this.setState((prevState) => {
        return {
          data: dataR.data,
          pending
        };
      });
    }
  }

  setPending(isPending: number) {
    console.log("setting pending to", isPending);
    let pending = false;
    if (isPending) {
      pending = true;
    }
    this.setState({
      pending
    });
  }

  changeBuffer(e: any) {
    this.setState({bufferSize: e.target.value});
  }

  render() {
    // TODO add pending
    let {baseData, data, pending} = this.state;
    let spinner: JSX.Element;
    let charts: JSX.Element[] = [];
    if (baseData) {
      if (data) {
        let keys = Object.keys(data).map(v => parseInt(v, 10)).sort().reverse();
        for (let i = 0; i < keys.length; i++) {
          let d = data[keys[i]];
          let aBuffer = Object.keys(baseData).map(k => {
            return <XFilterChart
              baseData={baseData[k]}
              xFilterData={d[k]}
              control= {i === 0}
              chart={k}
              key={k}
              pending={d[k] ? false : true}
            />;
          });
          charts.push(<>
            {aBuffer}
            <div style={{clear: "both"}}></div>
          </>);
        }
      } else {
        charts = Object.keys(baseData).map(k => {
          return <XFilterChart
            baseData={baseData[k]}
            control={true}
            xFilterData={null}
            chart={k}
            key={k}
            pending={true}
          />;
        });
      }
    } else {
      spinner = <><Indicator />Loading Initial Data...</>;
    }
    return (
      <div style={{position: "sticky", top: 0, backgroundColor: "white"}}>
        {charts}
        {spinner}
        <select
          value={this.state.bufferSize}
          onChange={this.changeBuffer}
        >
        <option value={1}>1</option>
        <option value={2}>2</option>
        <option value={3}>3</option>
        <option value={4}>4</option>
        </select>
      </div>);
  }
}