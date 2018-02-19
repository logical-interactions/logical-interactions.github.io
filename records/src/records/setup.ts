import * as sql from "sql.js";
import * as d3 from "d3";
import { Database } from "sql.js";

import { readFileSync } from "./helper";
import { pins } from "../data/pins";
import { getMapEventData } from "../lib/data";

// DB set up
export const db = new sql.Database();
// this will hopefully make things faster
// read https://sqlite.org/pragma.html
// db.run(`PRAGMA main.synchronous = 0`);
(<any>window).db = db;
db.run("PRAGMA foreign_keys = ON;");

let setupSql = "";
(["static", "persist", "data", "events", "mappings", "chronicles", "triggers"]).forEach(fn => {
  setupSql += readFileSync(`/sql/${fn}.sql`);
});

let UDFs: any[] = [];
function tiemNow() {
  return new Date();
}

let insertPin = db.prepare("INSERT INTO pinData (long, lat) VALUES (?, ?)");

export const insertInteractionStmt = db.prepare("INSERT INTO mapInteractions (ts, longMin, latMax, longMax, latMin) VALUES (?, ?, ?, ?, ?)");

function processResponse(response: any) {
  const {selection, data, itxid} = response;
  db.exec("BEGIN TRANSACTION;");
  data.forEach((d: any) => {
    insertPin.run(d);
  });
  db.exec("COMMIT;");
}

function queryPin(itxId: number, latMin: number, latMax: number, longMin: number, longMax: number) {
  getMapEventData(pins, itxId, {nw: [longMin, latMax], se: [longMax, latMin]}).then(processResponse);
}

UDFs.push(tiemNow);
UDFs.forEach((f) => {
  db.create_function(f.name, f);
});


export function tryDB(query: string) {
  try {
    db.run(query);
  } catch (e) {
    console.log(`%cDB execution error for query ${query}, ${e}`, "background: red");
  }
}



export const zoomSQL = db.prepare("INSERT INTO mapInteractions VALUES (:ts, :latMin;, :latMax, :longMin, :longMax);");