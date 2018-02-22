import * as sql from "sql.js";
import * as d3 from "d3";
import { Database } from "sql.js";

import { genSetMapStateTemp, readFileSync } from "../lib/helper";
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

export function setupCanvas(ctx: CanvasRenderingContext2D) {
  let {resetMapStateTemp, setMapStateTemp, getMapStateValue} = genSetMapStateTemp(ctx);
  [resetMapStateTemp, setMapStateTemp, getMapStateValue].forEach((f) => {
    db.create_function(f.name, f);
  });
}


function timeNow() {
  return +new Date();
}

export function log(msg: string, source: string) {
  console.log(`[${source}] ${msg}`);
  return 1;
}

function queryPin(itxId: number, latMin: number, latMax: number, longMin: number, longMax: number) {
  console.log("sending request for", itxId, latMin, latMax, longMin, longMax);
  getMapEventData(pins, itxId, {nw: [longMin, latMax], se: [longMax, latMin]}).then(processResponse);
}

let UDFs: any[] = [timeNow, queryPin, log];
UDFs.forEach((f) => {
  db.create_function(f.name, f);
});

let insertPin = db.prepare("INSERT INTO pinData (itxId, long, lat) VALUES (?, ?, ?)");

let insertPinResponse = db.prepare("INSERT INTO pinResponses (itxId, ts) VALUES (?, ?)");

export const undoQuery = `
  SELECT log('started', 'undo');
  UPDATE mapInteractions
    SET undoed = 1 WHERE itxId IN (SELECT itxId FROM mapInteractions ORDER BY itxId DESC LIMIT 1);
  INSERT INTO mapInteractions (ts, latMin, latMax, longMin, longMax, undoed)
    SELECT timeNow(), latMin, latMax, longMin, longMax, 2
    FROM mapInteractions
    WHERE undoed = 0
    ORDER BY itxId DESC LIMIT 1;
  UPDATE mapInteractions
    SET undoed = 1
    WHERE itxId IN (
      SELECT itxId
      FROM mapInteractions
      WHERE undoed = 0
      ORDER BY itxId DESC LIMIT 1);
  -- then set it back to 1
  UPDATE mapInteractions
    SET undoed = 0 WHERE undoed = 2;
`;

export const insertInteractionStmt = db.prepare("INSERT INTO mapInteractions (ts, longMin, latMax, longMax, latMin) VALUES (?, ?, ?, ?, ?)");

function processResponse(response: any) {
  console.log("received response", response);
  const {selection, data, itxId} = response;
  db.exec("BEGIN TRANSACTION;");
  // also want to insert into pinResponse to indicate that we have values...
  // if it's here, it must be that the dataId is the same as interaction Id, that is, the same query was issued.
  data.forEach((d: any) => {
    d.unshift(itxId);
    insertPin.run(d);
  });
  insertPinResponse.run([itxId, +new Date()]);
  db.exec("COMMIT;");
}

export function tryDB(query: string) {
  try {
    db.run(query);
  } catch (e) {
    console.log(`%cDB execution error for query ${query}, ${e}`, "background: red");
  }
}

// for console debugging
function d(sql: string) {
  let r = db.exec(sql);
  if (r.length > 0) {
    console.log(JSON.stringify(r[0].values).replace(/\],\[/g, "\n").replace("[[", "").replace("]]", "").replace(/,/g, "\t"));
  } else {
    console.log("NO RESULT");
  }
}
(<any>window).d = d;