import * as sql from "sql.js";
import * as d3 from "d3";
import { Database } from "sql.js";

import { readFileSync } from "../lib/helper";

// DB set up
export const db = new sql.Database();
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
function d(sql: string) {
  let r = db.exec(sql);
  if (r.length > 0) {
    console.log(JSON.stringify(r[0].values).replace(/\],\[/g, "\n").replace("[[", "").replace("]]", "").replace(/,/g, "\t"));
  } else {
    console.log("NO RESULT");
  }
}
(<any>window).d = d;

let UDFs: any[] = [timeNow, log];
UDFs.forEach((f) => {
  db.create_function(f.name, f);
});

export function executeFile(folder: string, fn: string) {
  let setupSql = readFileSync(`/src/records/${folder}/${fn}.sql`);
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