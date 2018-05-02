import * as d3 from "d3";
import { db, executeFile } from "../setup";
import { QueryResults } from "sql.js";
import BarChart from "../../components/BarChart";
import LineChart from "../../components/LineChart";
import Timeline from "../../components/Timeline";
import { brush } from "d3";
import TableView from "../../components/TableView";

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
  window.setInterval(insertSomeEvent, 1000);
  window.setInterval(inserSomeUserInfo, 1000);
}

function _getTwoNums(s: string) {
  let r = db.exec(s);
  if (r.length > 0) {
    return r[0].values[0] as number[];
  }
  return [null, null];
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
  let r2 = _getTwoNums(`select low, high from currentBrush`);
  c.setLineChartFilter(r2[0], r2[1]);
}

export function setTimelineStateHelper(c: Timeline) {
  let all = _getTwoNums(`select * from allHistoryRange`);
  let brush = _getTwoNums(`select low, high from currentBrush`);
  c.setTimelineState(all[0], all[1], brush[0], brush[1]);
  // let r3 = db.exec(`select * from allBrushes`);
  // TODO
}

export function setTableViewHelper(c: TableView) {
  // get visible tables
  // not very fancy and screen aware yet...
  let r = db.exec(`select * from filteredDataView`);
  if (r.length > 0) {
    c.setTableViewValues(r[0].values);
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

export function setWindow(low: number, high: number) {
  db.run(`insert into itx (ts, low, high, itxType) values (${+Date.now()}, ${low}, ${high}, ${"\'window\'"})`);
}

export function removeBrush() {
  db.run(`insert into itx (ts, low, high, itxType) values (${+Date.now()}, -1, -1, \'userBrush\')`);
}

export function brushItx(low: number, high: number, relativeLow: number, relativeHigh: number, itxFixType: string) {
  db.run(`insert into itx (ts, low, high, relativeLow, relativeHigh, itxType, itxFixType) values (${+Date.now()}, ${low}, ${high}, ${relativeLow}, ${relativeHigh}, \'userBrush\', \'${itxFixType}\')`);
}

const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
// generate data to populate, preprocessing step
// logic needs fixing
const inserEventStmt = db.prepare(`INSERT INTO events (ts, val, id, a, b) VALUES (?, ?, ?, ?, ?)`);
export function insertSomeEvent() {
  let normal = d3.randomNormal(10, 5);
  let val = normal();
  let id = [1, 1, 1].map(v => possible.charAt(Math.floor(Math.random() * possible.length))).join("");
  let a = aSeries[Math.floor(Math.random() * 3)];
  let b = bSeries[Math.floor(Math.random() * 3)];
  setTimeout(() => {
    inserEventStmt.run([+new Date(), val, id, a, b]);
  }, Math.random() * 1000);
}

const insertUserStmt = db.prepare(`INSERT INTO user (ts, id, c, d)`);
export function inserSomeUserInfo() {
  let normal = d3.randomNormal(10, 2);
  // for existing users in events
  // now get some data from events
  // and populate with user
  let r = db.exec(`SELECT id FROM events ORDER BY RANDOM() LIMIT 1`);
  if (r.length > 0) {
    let c = normal();
    let d = c + Math.random();
    // try inserting
    let id = r[0].values[0][0];
    let r2 = db.exec(`select c, d from user where id = ${id}`);
    if (r2.length > 0) {
      c = r2[0].values[0][0] as number + Math.random();
      d = r2[0].values[0][1] as number + Math.random();
    }
    setTimeout(() => {
      inserEventStmt.run([+new Date(), id, c, d]);
    }, Math.random() * 1000);
  } else {
    debugger;
    console.log("Weird that there is no events");
  }
}