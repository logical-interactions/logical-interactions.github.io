import * as d3 from "d3";
import { db, executeFile } from "../setup";
import { QueryResults } from "sql.js";
import BarChart from "../../components/BarChart";
import LineChart from "../../components/LineChart";
import Timeline from "../../components/Timeline";
import { brush } from "d3";

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

export function setLineChartStateHelper(c: LineChart) {
  let r = db.exec(`select * from chartTimeData`);
  if (r.length > 0) {
    let dataRaw = r[0].values as number[][];
    if (dataRaw) {
      // turn into a dictionary and match
      c.setLineChartDataState(dataRaw.map((d) => ({x: d[0], y: d[1]})));
    }
  }
  // also need to set the new filter if any
  let r2 = db.exec(`select low, high from currentBrush`);
  if (r2.length > 0) {
    let d = r2[0].values[0] as number[];
    if (d) {
      c.setLineChartFilter(d[0], d[1]);
    }
  }
}

export function setTimelineStateHelper(c: Timeline) {
  let r1 = db.exec(`select * from allHistoryRange`);
  let r2 = db.exec(`select low, high from currentBrush`);
  if ((r1.length > 0) && (r2.length > 0)) {
    let allRange = r1[0].values[0] as number[];
    let brushRange = r2[0].values[0] as number[];
    c.setTimelineState(allRange[0], allRange[1], brushRange[0], brushRange[1]);
  }
  let r3 = db.exec(`select * from allBrushes`);
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

export function removeBrush() {
  db.run(`insert into itx (ts, low, high, itxType) values (${+Date.now()}, -1, -1, \'userBrush\')`);
}

export function brushItx(low: number, high: number, relativeLow: number, relativeHigh: number, itxFixType: string) {
  db.run(`insert into itx (ts, low, high, relativeLow, relativeHigh, itxType, itxFixType) values (${+Date.now()}, ${low}, ${high}, ${relativeLow}, ${relativeHigh}, \'userBrush\', \'${itxFixType}\')`);
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