
import * as d3 from "d3";
import { Statement, QueryResults } from "sql.js";

import { db, executeFile } from "../setup";
import { xFilterWorker } from "./workerSetup";

export const XFILTERCHARTS = ["hour", "delay", "distance"];
// data shape transformations...
export function parseChartData(res: QueryResults[]) {
  if (res[0] && res[0].values && res[0].values.length > 0 ) {
    let cols = res[0].columns;
    if ((cols[0] !== "chart") || (cols[1] !== "bin") || (cols[2] !== "count") || (cols[3] !== "itxId")) {
      throw new Error("Section do not match");
    }
    let v = res[0].values;
    let itxId = -1;
    let data: {[index: string]: {[index: string]: {x: number, y: number}[]}} = {};
    v.forEach(e => {
      // so annoying
      let itxId = (e[3] as number).toString(10);
      if (!(itxId in data)) {
        data[itxId] = {
          hour: [],
          delay: [],
          distance: []
        };
      }
      let chart = e[0] as string;
      data[itxId][chart].push({x: e[1] as number, y: e[2] as number});
    });
    console.log("returning data", data);
    return {
      data
    };
  }
  return {
    data: null
  };
}

// if buffer size is 1, normal, else, chronicles
// TODO, add buffer: number
export function setupXFilterDB() {
  ["tables", "views", "dataFetchTriggers", "renderTriggers"].map(f => {executeFile("XFilter", f); });
  db.create_function("queryWorker", queryWorker);
  db.create_function("checkAtomic", (charts: string) => {
    if (!charts) {
      return 0;
    }
    let isAtomic = XFILTERCHARTS.reduce((acc, val) => {
      return acc && (charts.indexOf(val) > -1);
    }, true);
    // console.log("Xfilter atomic", isAtomic);
    if (isAtomic) {
      return 1;
    } else {
      return 0;
    }
  });
  // date,delay,distance,origin,destination
  // let insertData = db.prepare(`INSERT INTO flight VALUES (?, ?, ?, ?, ?)`);
  // // do the binning here
  // d3.text("/data/flights.json", function(error, _data) {
  //   db.exec("BEGIN TRANSACTION;");
  //   let arrays = d3.csvParseRows(_data);
  //   arrays.forEach(d => {
  //     insertData.run(d);
  //   });
  //   db.exec(`INSERT INTO binnedData SELECT * FROM binnedDataView`);
  //   db.exec("COMMIT;");
  // });
}

export function getXFilterStmts() {
  let stmts: {
    insertBrushItx: Statement;
  };
  if (!stmts) {
    stmts = {
      insertBrushItx: db.prepare(`INSERT INTO xBrushItx (ts, low, high, chart) VALUES (?, ?, ?, ?)`)
    };
  }
  return stmts;
}

// the input should already be from a group_concat
// they can just specify the remote

export function queryWorker(requestId: number, skipTable: string) {
  console.log("worker doing job", requestId);
  let sharedTable = "xFilterRequest";
  // now get the values for
  // need to share the currentIn
  // could use some basic DSL here --- copy pasting
  let getTableDefinition = `
    SELECT sql
    FROM sqlite_master
    WHERE
      type = 'table'
      AND name = '${sharedTable}';
  `;
  let definition = db.exec(getTableDefinition)[0].values[0];
  if (!definition) {
    throw new Error (`${sharedTable} not defined in client db`);
  }
  let tableRes = db.exec(`SELECT * FROM ${sharedTable} WHERE requestId = ${requestId}`)[0];
  if ((!tableRes) || (!tableRes.values)) {
    throw new Error(`This should not have happened, ${sharedTable} should have been defined with ${requestId}`);
  }
  // need to make null explicit here...
  let shareSql = `
    DROP TABLE IF EXISTS ${sharedTable};
    ${definition};
    INSERT INTO ${sharedTable} VALUES ${tableRes.values.map((d) => `(${d.map((v) => v ? v : "null").join(", ")})`)};
  `;
  // console.log("sharesql", shareSql);
  let workerPromise = xFilterWorker();
  workerPromise.then(worker => {
    worker.postMessage({
      id: `insertThenShare:${requestId}:${skipTable}`,
      action: "exec",
      sql: shareSql
    });
  });
}

export function updateComponents() {
  // if there is a new brush
  // trigger the render from the sql
  let res = db.run(`
  `);
  // res.values
}

// the 0 is so that we can reuse parsing on the javascript side
// #WATCH: this might be an expensive query
export const initialStateSQL = `
SELECT
  d.chart, d.bin, d.count, 0 AS itxId
FROM
  chartData d
  JOIN xFilterRequest r ON d.requestId = r.requestId
WHERE
  r.hourLow IS NULL AND r.hourHigh IS NULL
  AND r.delayLow IS NULL AND r.delayHigh IS NULL
  AND r.distanceLow IS NULL AND r.distanceHigh IS NULL;`;

export function getXFilterChroniclesSQL(buffer: number) {
  return `
  SELECT
    d.chart,
    d.bin,
    d.count,
    req.itxId AS itxId
  FROM
    xFilterResponse res
    JOIN xFilterRequest req ON res.requestId = req.requestId
    JOIN chartData d ON d.requestId = res.dataId
  WHERE req.itxId IN (
      SELECT itxId FROM currentItx ORDER BY itxId DESC LIMIT ${buffer}
    )
  ORDER BY itxId DESC;`;
}