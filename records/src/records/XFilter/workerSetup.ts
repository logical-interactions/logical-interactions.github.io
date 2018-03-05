import { readFileSync } from "../../lib/helper";
import { db } from "../setup";

let worker: Worker = null;

export function xFilterWorker() {
  if (!worker) {
    worker = new Worker("/lib/worker.sql.js");

    fetch("/data/flight_small.db")
    .then(response => {
      if (response.status !== 200) {
        console.log(`There was a problem: ${response.status}`);
        return;
      }
      worker.postMessage({
        id: 1,
        action: "open",
        buffer: response,
      });
    });
    const CHARTS = ["hour", "delay", "distance"];
    worker.onmessage = function() {
      console.log("Database opened");
      let setupSql = readFileSync(`/src/records/XFilter/workerViews.sql`);
      worker.postMessage({
        id: "workerViews",
        action: "exec",
        sql: setupSql
      });
      worker.onmessage = function(event) {
        console.log("got db data", event.data);
        // The result of the query
        // id, with results for exec
        // now send this to the main db
        // communication protocal, split by ":",
        // [insert|read]:[tablename]:[param 1]:[param 2] etc.
        // a bit brittle...
        let chart = event.data.id.split(":")[1];
        if (CHARTS.indexOf(chart) > -1) {
          let filterId = event.data.id.split(",")[2];
          let sql = `INSERT INTO ${chart}ChartData VALUES ${event.data.results.map((r: any) => `(${filterId}, ${r[0]}, ${r[1]})`)}$;`;
          db.exec(sql);
        }
      };
    };
    worker.onerror = function(e) {console.log("Worker error: ", e); };
  }
  return worker;
}
