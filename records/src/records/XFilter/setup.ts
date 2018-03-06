
import * as d3 from "d3";
import { Statement, QueryResults } from "sql.js";

import { db, executeFile } from "../setup";
import { xFilterWorker } from "./workerSetup";

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
  ["tables", "views", "dataFetchTriggers"].map(f => {executeFile("XFilter", f); });
  db.create_function("queryWorker", queryWorker);
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

export function queryWorker(itxId: number) {
  let worker = xFilterWorker();
  let sharedTable = "filters";
  // now get the values for
  // need to share the currentIn
  // could use some basic DSL here --- copy pasting
  let getTableDefinition = `
    SELECT sql
    FROM sqlite_master
    WHERE
      type = 'table'
      AND name = ${sharedTable};
  `;
  let definition = db.run(getTableDefinition);
  let values = db.exec(`SELECT * FROM ${sharedTable} WHERE itxId = ${itxId}`)[0].values;
  if (!values) {
    throw new Error (`${sharedTable} not defined`);
  }
  let shareSql = `
    DROP TABLE IF EXISTS ${sharedTable};
    ${getTableDefinition};
    INSERT INTO ${sharedTable} VALUES ${values.map((d) => `(${d})`)};
  `;
  worker.postMessage({
    id: "insert:currentItx",
    action: "exec",
    sql: shareSql
  });
  ["hour", "delay", "distance"].map((n) => {
    let querySql = `
      SELECT * FROM ${n}ChartDataView;
    `;
    worker.postMessage({
      id: `read:${n}ChartDataView:${itxId}`,
      action: "exec",
      sql: querySql
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

