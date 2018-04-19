import * as d3 from "d3";
import { db, executeFile } from "../setup";
import { QueryResults } from "sql.js";
import BarChart from "../../components/BarChart";
import LineChart from "../../components/LineChart";

// create the tables

export const chartAName = "chartA";
export const chartBName = "chartB";
export const chartScatterName = "chartScatter";

export const aSeries = ["low", "middle", "high"];
export const bSeries = ["bad", "average", "good"];

export function setupDial() {
  ["static", "tables", "views", "triggers"].map(f => {
     executeFile("streaming", f);
  });
  setupInitialData(100);
}

// create the UDFs

// streaming

export function setLineChartStateHelper(name: string, c: LineChart) {
  let r = db.exec(`select * from ${name}`);
  if (r.length > 0) {
    let dataRaw = r[0].values as number[][];
    if (dataRaw) {
      c.setLineChartDataState(dataRaw.map((d) => ({x: d[0], y: d[1]})));
    }
  }
}

export function setBarChartStateHelper(name: string, c: BarChart) {
  let r = db.exec(`select * from ${name}`);
  if (r.length > 0) {
    let dataRaw = r[0].values as number[][];
    if (dataRaw) {
      c.setChartDataState(dataRaw.map((d) => (d[0])));
    }
  }
}

export function getNextData(low: number, high: number) {
  db.run(`insert into itx (ts, low, high, itxType) values (${+Date.now()}, ${low}, ${high}, ${"\'window\'"})`);
}

// generate data to populate, preprocessing step
// logic needs fixing
export function setupInitialData(total: number) {
  let stmt = db.prepare(`INSERT INTO events (ts, val, a, b, c, d) VALUES (?, ?, ?, ?, ?, ?)`);
  for (let i = 0; i < total; i ++) {
    let val = d3.randomNormal(10, 5)();
    let coin = d3.randomUniform()();
    let a = aSeries[0];
    let b = bSeries[0];
    if (coin > 0.3) {
      if (coin > 0.6) {
        a = aSeries[2];
        b = bSeries[2];
      } else {
        a = aSeries[1];
        b = bSeries[1];
      }
    }
    let c = coin;
    let d = coin + Math.random();
    stmt.run([i, val, a, b, c, d]);
  }
}