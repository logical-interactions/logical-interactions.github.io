import { readFileSync } from "../../lib/helper";
import { db, ISPROD } from "../setup";

let worker: Worker = null;
// for debugging
let opened = false;
let setup = false;
(<any>window).worker = worker;

export function xFilterWorker(): Promise<Worker> {
  return new Promise((resolve, reject) => {
    if (!worker) {
      worker = new Worker("./dist/worker.sql.js");
      fetch("./dist/flight_small.db")
      .then(response => {
        if (response.status !== 200) {
          console.log(`There was a problem: ${response.status}`);
          return;
        }
        return response.arrayBuffer();
      })
      .then(buffer => {
        console.log("Setting up db in the worker", buffer);
        worker.postMessage({
          id: "open",
          action: "open",
          buffer,
        });
      });

      worker.onmessage = function(event) {
        // console.log(`[Worker] ${event.data.id}`, event);
        // this is tied to the queryWorker in setup.ts
        let args = event.data.id.split(":");
        let cmd = args[0];
        switch (args[0]) {
          case "open": {
            console.log("[Worker] Database opened", event);
            if (opened) {
              throw new Error("Should not open worker DB twice");
            }
            opened = true;
            let fN = ISPROD ? "./dist/sql/XFilter/workerViews.sql" : "/src/records/XFilter/workerViews.sql";
            let setupSql = readFileSync(fN);
            worker.postMessage({
              id: "setup",
              action: "exec",
              sql: setupSql
            });
            break;
          }
          case "print": {
            let r = event.data.results;
            if (r && r.length > 0) {
              r[0].values.map((v: any) => {
                v.map((c: any, i: any) => {
                  if (r[0].columns[i] === "ts") {
                    c = new Date(c as number).toDateString();
                  }
                });
              });
              console.log("Printing results");
              console.log(r[0].columns.join("\t"));
              console.log(JSON.stringify(r[0].values).replace(/\],\[/g, "\n").replace("[[", "").replace("]]", "").replace(/,/g, "\t"));
            }
            break;
          }
          case "setup": {
            if (setup) {
              throw new Error("Should not setup worker DB twice");
            }
            setup = true;
            resolve(worker);
            break;
          }
          case "insertThenShare": {
            if ((!opened) || (!setup)) {
              throw new Error("Need to setup worker DB before using");
            }
            let requestId = args[1];
            let skipTable = args[2];
            worker.postMessage({
              id: "print",
              action: "exec",
              sql: `select * from sqlite_master;`
            });
            console.log(`[Worker: insertThenShare] querying db to share data for requestId ${requestId}, except ${skipTable}`);
            ["hour", "delay", "distance"].map((n) => {
              if (n !== skipTable) {
                let querySql = `
                  SELECT * FROM ${n}ChartDataView;
                `;
                // this is emulating a callback
                worker.postMessage({
                  id: `share:${requestId}:${n}`,
                  action: "exec",
                  sql: querySql
                });
              }
            });
            break;
          }
          case "share": {
            let requestId = args[1];
            let chart = args[2];
            // TODO: deal with pagination later?
            if (event.data.results[0] && event.data.results[0].values.length > 0) {
              let values = event.data.results[0].values;
              let sql = `
                INSERT INTO chartData VALUES ${values.map((r: any) => `(${requestId}, ${r[0]}, ${r[1]}, '${chart}')`)};
                INSERT INTO chartDataAtomic VALUES (${requestId}, '${chart}');
              `;
              db.exec(sql);
              // setTimeout(() => {
              //   console.log("exec to client db after intentional delay");
              //   db.exec(sql);
              // }, 1000);
            } else {
              console.log("No result for", chart, requestId);
            }
            break;
          }
        }
      };
      worker.onerror = function(e) {console.log("Worker error: ", e); };
    } else {
      resolve(worker);
    }
  });
}
