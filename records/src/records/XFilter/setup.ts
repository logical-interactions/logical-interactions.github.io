
import * as d3 from "d3";
import { db, executeFile } from "../setup";
import { xFilterWorker } from "./workerSetup";

// if buffer size is 1, normal, else, chronicles
export function setupXFilterDB(buffer: number) {
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

// the input should already be from a group_concat
// they can just specify the remote

export function queryWorker(v: any[]) {
  let worker = xFilterWorker();
  // need to share the currentIn
  // could use some basic DSL here --- copy pasting
  let shareSql = `
    DROP TABLE IF EXISTS currentItx;
    CREATE TABLE currentItx (
      itxId INTEGER PRIMARY KEY,
      ts INTEGER NOT NULL,
      low INTEGER NOT NULL,
      high INTEGER NOT NULL,
      chart TEXT NOT NULL
    );
    INSERT INTO currentItx VALUES ${v.map((d) => `(${d})`)};
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
      id: `read:${n}ChartDataView:${filterId}`,
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

