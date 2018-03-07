import * as React from "react";
// we can connect this with MapZoom
// so that it's more like a dashboard
// we can show its very easy to keep separateion of concerns

import { Indicator } from "./Indicator";
import { XFilterChart } from "./XFilterChart";
import { db } from "../records/setup";
import { parseChartData, setupXFilterDB, XFILTERCHARTS } from "../records/XFilter/setup";

// this is a good example of custom state management, where the parent manages children states

interface XFilterContainerState {
  // this will be inefficient since react does not know what actually changed and will likely refresh everything
  baseData: {[index: string]: {x: number, y: number}[]};
  data: {[index: string]: {x: number, y: number}[]};
}

export default class XFilterContainer extends React.Component<undefined, XFilterContainerState> {
  // fetch the data from the views
  // this should not be part of interactions since the state doesn't change
  // though the computation would be a bit wasted...
  // first compute the filter, but do not set the brush
  constructor(props: undefined) {
    super(props);
    this.refreshXFilterData = this.refreshXFilterData.bind(this);
    setupXFilterDB();
    db.create_function("refreshXFilter", this.refreshXFilterData);
    // the rest is null
    // INSERT INTO xFilterRequest (itxId, ts) VALUES (-1, timeNow());
    let t = +new Date();
    db.exec(`
      INSERT INTO brushItx (ts, chart) VALUES ${XFILTERCHARTS.map((v) => `(${t}, '${v}')`).join(", ")};
    `);
    this.state = {
      baseData: null,
      data: {}
    };
  }
  // componentDidMount() {
  // }

  refreshXFilterData() {
    // fetch from the db
    // this is different from map since it's more like "pull" based.
    // then update state
    console.log("[Component] refreshXFilterData called", "background: 'yellow'");
    if (!this.state.baseData) {
      // try fetching itgroup_concat
      // chart,
      // GROUP_CONCAT('(' || bin || '&'|| count || ')', ';') AS values
      let baseRes = db.exec(`
        SELECT
          d.chart, d.bin, d.count
        FROM
          chartData d
          JOIN xFilterRequest r ON d.requestId = r.requestId
        WHERE
          r.hourLow IS NULL AND r.hourHigh IS NULL
          AND r.delayLow IS NULL AND r.delayHigh IS NULL
          AND r.distanceLow IS NULL AND r.distanceHigh IS NULL;
      `);
      let baseData = parseChartData(baseRes);
      console.log("response", baseRes, baseData);
      if (baseData) {
        this.setState({
          baseData
        });
      }
    }
    let res = db.exec(`
      SELECT
        d.chart, d.bin, d.count
      FROM
        xFilterResponse res
        JOIN xFilterRequest req ON res.requestId = req.requestId
        JOIN chartData d ON d.requestId = res.dataId
      WHERE req.itxId = (SELECT MAX(itxId) FROM currentItx);
    `);
    let data = parseChartData(res);
    if (data) {
      this.setState((prevState) => {
        return {
          data
        };
      });
    }
  }

  render() {
    // TODO add pending
    let {baseData, data} = this.state;
    let spinner: JSX.Element;
    let charts: JSX.Element[];
    if (baseData) {
      charts = Object.keys(baseData).map(k => {
        return <XFilterChart
          baseData={baseData[k]}
          xFilterData={data[k]}
          chart={k}
          key={k}
          pending={false}
        />;
      });
    } else {
      spinner = <Indicator />;
    }
    return (<>
      {charts}
      {spinner}
      </>);
  }
}