import * as sql from "sql.js";
import * as d3 from "d3";
import { Database } from "sql.js";
import { readFileSync } from "../lib/helper";

const ISPROD = false;

console.log("DB setup file executing");

// DB set up
export let db = new sql.Database();

// this will hopefully make things faster
// read https://sqlite.org/pragma.html
// db.run(`PRAGMA main.synchronous = 0`);
(<any>window).db = db;
db.run("PRAGMA foreign_keys = ON;");

// general setup

export function tryDB(query: string) {
  try {
    db.run(query);
  } catch (e) {
    console.log(`%cDB execution error for query ${query}, ${e}`, "background: red");
  }
}

// for console debugging
export function d(sql: string) {
  let r = db.exec(sql);
  if (r.length > 0) {
    r[0].values.map((v) => {
      v.map((c, i) => {
        if (r[0].columns[i] === "ts") {
          c = new Date(c as number).toDateString();
        }
      });
    });
    console.log(r[0].columns.join("\t"));
    console.log(JSON.stringify(r[0].values).replace(/\],\[/g, "\n").replace("[[", "").replace("]]", "").replace(/,/g, "\t"));
  } else {
    console.log("NO RESULT");
  }
}
(<any>window).d = d;

export function executeFile(folder: string, fn: string) {
  let path = ISPROD ? "./dist/sql" : "/src/sql";
  let setupSql = readFileSync(`${path}/${folder}/${fn}.sql`);
  let scripts = setupSql.split(";\n\n");
  scripts.forEach((s, i) => {
    s = s.replace(/^ *--.*$/mg, "");
    if (i < scripts.length - 1) {
      s += ";";
    }
    // for debugging, easier to split
    console.log("executing ", s);
    db.run(s);
  });
}

// general UDF helper

function log(msg: string, source: string) {
  console.log(`[${source}] ${msg}`);
  return 1;
}

function timeNow() {
  return +new Date();
}

function assertNoBigger(v1: number, v2: number, msg: string) {
  if (v1 > v2) {
    throw new Error(`${v1} is larger than ${v2}, ${msg}`);
  }
}

// must do this manually because bundling minimizes the function anmes...
db.create_function("timeNow", timeNow);
db.create_function("log", log);
db.create_function("assertNoBigger", assertNoBigger);

// let UDFs: any[] = [timeNow, log, assertNoBigger];
// UDFs.forEach((f) => {
//   console.log("[UDF] shared setup", f.name);
// });

function _downloadHelper(blob: Blob, name: string) {
  let a = document.createElement("a");
  a.href = window.URL.createObjectURL(blob);
  a.download = name;
  a.onclick = function() {
    setTimeout(function() {
      window.URL.revokeObjectURL(a.href);
    }, 1500);
  };
  a.click();
}

export function downloadDB() {
  console.log("download session");
  let dRaw = db.export();
  let blob = new Blob([dRaw]);
  _downloadHelper(blob,  "session.db");
}
(<any>window).downloadDB = downloadDB;

export function downloadQueryResultAsCSV(query: string) {
  let csvContent = "";
  let r = db.exec(query);
  if (r.length && r[0].values) {
    csvContent += r[0].columns.join(",") + "\r\n";
    r[0].values.forEach((rowArray) => {
      let row = rowArray.join(",");
      csvContent += row + "\r\n";
    });
    let b = new Blob([csvContent], {type: "text/plain;charset=UTF-8"});
    _downloadHelper(b, "userData.csv");
    console.log("should have downloaded", csvContent);
  } else {
    console.log("NO RESULT");
  }
}

export function loadDb(f: Blob) {
  // delete the current DB and create a new one
  let r = new FileReader();
  r.onload = function() {
    console.log("Updated to the updated session");
    let Uints = new Uint8Array(r.result);
    db = new sql.Database(Uints);
  };
  r.readAsArrayBuffer(f);
}

export function getComponentPendingFuncName(chartName: string) {
  return `set${chartName}PendingState`;
}

export function getComponentStateFuncName(chartName: string) {
  return `set${chartName}DataState`;
}