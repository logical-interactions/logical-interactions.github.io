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

export const series: {[index: string]: string[]} = {
  "chartAData": aSeries,
  "chartBData": bSeries
};

export function setupDial() {
  ["static", "tables", "views", "triggers"].map(f => {
     executeFile("streaming", f);
  });
  setupInitialData(1000);
}

// create the UDFs

// streaming

export function setLineChartStateHelper(name: string, c: LineChart) {
  let r = db.exec(`select * from ${name}`);
  if (r.length > 0) {
    let dataRaw = r[0].values as number[][];
    if (dataRaw) {
      // turn into a dictionary and match
      c.setLineChartDataState(dataRaw.map((d) => ({x: d[0], y: d[1]})));
    }
  }
}

export function setBarChartStateHelper(name: string, c: BarChart) {
  let r = db.exec(`select * from ${name}`);
  if (r.length > 0) {
    let dataRaw = r[0].values;
    let lookup: {[index: string]: number} = {};
    dataRaw.forEach(e => {
      lookup[e[0] as string] = e[1] as number;
    });
    if (dataRaw) {
      c.setChartDataState(series[name].map((d) => lookup[d]));
    }
  }
}

export function getNextData(low: number, high: number) {
  db.run(`insert into itx (ts, low, high, itxType) values (${+Date.now()}, ${low}, ${high}, ${"\'window\'"})`);
}

export function brushItx(low: number, high: number) {
  db.run(`insert into itx (ts, low, high, itxType) values (${+Date.now()}, ${low}, ${high}, ${"\'brush\'"})`);
}

// generate data to populate, preprocessing step
// logic needs fixing
export function setupInitialData(total: number) {
  let stmt = db.prepare(`INSERT INTO events (ts, val, a, b, c, d) VALUES (?, ?, ?, ?, ?, ?)`);
  for (let i = 0; i < total; i ++) {
    let val = d3.randomNormal(10, 5)();
    let a = aSeries[Math.floor(Math.random() * 3)];
    let b = bSeries[Math.floor(Math.random() * 3)];
    let c = Math.random() * 2;
    let d = c + Math.random();
    stmt.run([i, val, a, b, c, d]);
  }
}