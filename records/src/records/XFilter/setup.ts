
import * as d3 from "d3";
import { Statement, QueryResults } from "sql.js";

import { db, executeFile } from "../setup";
import { xFilterWorker } from "./workerSetup";

export const XFILTERCHARTS = ["hour", "delay", "distance"];
// data shape transformations...
export function parseChartData(res: QueryResults[]) {
  if (res[0] && res[0].values && res[0].values.length > 0 ) {
    let cols = res[0].columns;
    if ((cols[0] !== "chart") && (cols[1] !== "bin") && (cols[1] !== "count")) {
      throw new Error("Section do not match");
    }
    let v = res[0].values;
      let data: {[index: string]: {x: number, y: number}[]} = {
        hour: [],
        delay: [],
        distance: []
      };
      v.forEach(e => {
        let chart = e[0] as string;
        data[chart].push({x: e[1] as number, y: e[2] as number});
      });
      return data;
  }
  return null;
}

// if buffer size is 1, normal, else, chronicles
// TODO, add buffer: number
export function setupXFilterDB() {
  ["tables", "views", "dataFetchTriggers", "renderTriggers"].map(f => {executeFile("XFilter", f); });
  db.create_function("queryWorker", queryWorker);
  db.create_function("checkAtomic", (charts: string) => {
    let isAtomic = XFILTERCHARTS.reduce((acc, val) => {
      return acc && (charts.indexOf(val) > -1);
    }, true);
    console.log("Xfilter atomic", isAtomic);
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
      insertBrushItx: db.prepare(`INSERT INTO brushItx (ts, low, high, chart) VALUES (?, ?, ?, ?)`)
    };
  }
  return stmts;
}

// the input should already be from a group_concat
// they can just specify the remote

export function queryWorker(requestId: number) {
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
  console.log("sharesql", shareSql);
  let workerPromise = xFilterWorker();
  workerPromise.then(worker => {
    worker.postMessage({
      id: `insertThenShare:${requestId}`,
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

