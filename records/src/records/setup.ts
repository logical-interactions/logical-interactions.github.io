import * as sql from "sql.js";
import * as d3 from "d3";
import { Database } from "sql.js";

import { genSetMapStateTemp, readFileSync } from "./helper";
import { pins } from "../data/pins";
import { getMapEventData } from "../lib/data";

// DB set up
export const db = new sql.Database();
// this will hopefully make things faster
// read https://sqlite.org/pragma.html
// db.run(`PRAGMA main.synchronous = 0`);
(<any>window).db = db;
db.run("PRAGMA foreign_keys = ON;");

function _executeFile(fn: string) {
  let setupSql = readFileSync(`/src/records/${fn}.sql`);
  let scripts = setupSql.split(";\n\n");
  scripts.forEach((s, i) => {
    s = s.replace(/^--.*$/mg, "");
    if (i < scripts.length - 1) {
      s += ";";
    }
    // for debugging, easier to split
    db.run(s);
    console.log("executed ", s);
  });
}

_executeFile("static");

export function setupTriggers() {
  // we need to wait for the UDFs to be loaded, trigger by the respective components
  _executeFile("triggers");
}

let {resetMapStateTemp, setMapStateTemp, getMapStateValue} = genSetMapStateTemp();

function timeNow() {
  return new Date();
}

export function log(msg: string, source: string) {
  console.log(`[${source}] ${msg}`);
  return 1;
}

function queryPin(itxId: number, latMin: number, latMax: number, longMin: number, longMax: number) {
  console.log("sending request for", itxId, latMin, latMax, longMin, longMax);
  getMapEventData(pins, itxId, {nw: [longMin, latMax], se: [longMax, latMin]}).then(processResponse);
}

let UDFs: any[] = [timeNow, resetMapStateTemp, setMapStateTemp, getMapStateValue, queryPin, log];
UDFs.forEach((f) => {
  db.create_function(f.name, f);
});

let insertPin = db.prepare("INSERT INTO pinData (long, lat) VALUES (?, ?)");

export const insertInteractionStmt = db.prepare("INSERT INTO mapInteractions (ts, longMin, latMax, longMax, latMin) VALUES (?, ?, ?, ?, ?)");

function processResponse(response: any) {
  console.log("received response", response);
  const {selection, data, itxid} = response;
  db.exec("BEGIN TRANSACTION;");
  data.forEach((d: any) => {
    insertPin.run(d);
  });
  db.exec("COMMIT;");
}

export function tryDB(query: string) {
  try {
    db.run(query);
  } catch (e) {
    console.log(`%cDB execution error for query ${query}, ${e}`, "background: red");
  }
}