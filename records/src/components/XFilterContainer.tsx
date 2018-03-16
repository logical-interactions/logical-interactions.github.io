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
  data: {[index: string]: {x: number, y: number}[]}[];
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

  // componentDidMount() {
  // }

  refreshXFilterData() {
    // fetch from the db
    // this is different from map since it's more like "pull" based.
    // then update state
    // console.log("[Component] refreshXFilterData called", "background: 'yellow'");
    if (!this.state.baseData) {
      // try fetching itgroup_concat
      // chart,
      // GROUP_CONCAT('(' || bin || '&'|| count || ')', ';') AS values
      let baseRes = db.exec(initialStateSQL);
      let baseDataR = parseChartData(baseRes);
      // console.log("response", baseRes, baseDataR);
      if (baseDataR.data) {
        this.setState({
          baseData: baseDataR.data[0],
        });
      }
    }
    let query = getXFilterChroniclesSQL(this.state.bufferSize);
    let res = db.exec(query);
    let dataR = parseChartData(res);
    if (dataR.data) {
      let pending = false;
      db.exec(`INSERT INTO xFilterRender (ts) VALUES (${+new Date()})`);
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
        data.forEach(d => {
          let aBuffer = Object.keys(baseData).map(k => {
            return <XFilterChart
              baseData={baseData[k]}
              xFilterData={d[k]}
              chart={k}
              key={k}
              pending={false}
            />;
          });
          charts.push(<>
            {aBuffer}
            <div style={{clear: "both"}}></div>
          </>);
        });
      } else {
        charts = Object.keys(baseData).map(k => {
          return <XFilterChart
            baseData={baseData[k]}
            xFilterData={null}
            chart={k}
            key={k}
            pending={false}
          />;
        });
      }
      if (pending) {
        spinner = <><Indicator />Processing Request</>;
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