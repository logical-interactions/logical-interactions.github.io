import * as React from "react";
// we can connect this with MapZoom
// so that it's more like a dashboard
// we can show its very easy to keep separateion of concerns

import { Indicator } from "./Indicator";
import XFilterChart from "./XFilterChart";
import { db } from "../records/setup";
import { parseChartData, setupXFilterDB, XFILTERCHARTS, initialStateSQL, getXFilterChroniclesSQL } from "../records/XFilter/setup";

// this is a good example of custom state management, where the parent manages children states

interface XFilterContainerState {
  // this will be inefficient since react does not know what actually changed and will likely refresh everything
  baseData: {[index: string]: {x: number, y: number}[]};
  data: {[index: string]: {[index: string]: {x: number, y: number}[]}};
  pending: boolean;
  bufferSize: number;
  itxIdSet: number[];
  additionalLatency: number;
}

export default class XFilterContainer extends React.Component<undefined, XFilterContainerState> {
  // fetch the data from the views
  // this should not be part of interactions since the state doesn't change
  // though the computation would be a bit wasted...
  // first compute the filter, but do not set the brush
  constructor(props: undefined) {
    super(props);
    this.refreshXFilterData = this.refreshXFilterData.bind(this);
    this.setPending = this.setPending.bind(this);
    this.changeBuffer = this.changeBuffer.bind(this);
    setupXFilterDB();
    db.create_function("refreshXFilter", this.refreshXFilterData);
    db.create_function("setXFilterPending", this.setPending);
    // the rest is null
    // INSERT INTO xFilterRequest (itxId, ts) VALUES (-1, timeNow());
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
    // fetch from the db
    // this is different from map since it's more like "pull" based.
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