import * as d3 from "d3";
import { db, executeFile } from "../setup";
import { QueryResults } from "sql.js";
import BarChart from "../../components/BarChart";
import LineChart from "../../components/LineChart";
import Timeline from "../../components/Timeline";
import { brush } from "d3";
import TableView from "../../components/TableView";
import { getFormattedTime } from "../../lib/helper";

export const chartAName = "chartA";
export const chartBName = "chartB";
export const chartScatterName = "chartScatter";

export const aSeries = ["east coast", "west coast", "other"];
export const bSeries = ["m", "f", "undefined"];

export const series: {[index: string]: string[]} = {
  "chartAData": aSeries,
  "chartBData": bSeries
};

export function setupDial() {
  ["static", "tables", "views", "triggers"].map(f => {
     executeFile("streaming", f);
  });
  const inserEventStmt = db.prepare(`INSERT INTO events (ts, val, id, a, b) VALUES (?, ?, ?, ?, ?)`);
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  // generate data to populate, preprocessing step
  // logic needs fixing
  function insertSomeEvent(delay = 1000, timeOffset = 0) {
    let normal = d3.randomNormal(10, 5);
    let val = normal();
    let id = [1, 1, 1].map(v => possible.charAt(Math.floor(Math.random() * possible.length))).join("");
    let a = aSeries[Math.floor(Math.random() * 3)];
    let b = bSeries[Math.floor(Math.random() * 3)];
    setTimeout(() => {
      inserEventStmt.run([+new Date() - timeOffset, val, id, a, b]);
    }, Math.random() * delay);
  }

  const insertUserStmt = db.prepare(`INSERT INTO user (ts, id, c, d) VALUES (?, ?, ?, ?)`);
  function inserSomeUserInfo(delay = 1000) {
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
      let r2 = db.exec(`select c, d from user where id = \'${id}\'`);
      if (r2.length > 0) {
        c = r2[0].values[0][0] as number + Math.random();
        d = r2[0].values[0][1] as number + Math.random();
      }
      setTimeout(() => {
        insertUserStmt.run([+new Date(), id, c, d]);
      }, Math.random() * delay);
    } else {
      // debugger;
      console.log("Weird that there is no events");
    }
  }
  // do a bunch to start
  for (let i = 0; i < 10; i ++) {
    insertSomeEvent(0, i * 10000 + Math.round(Math.random() * 5000));
  }
  for (let i = 0; i < 5; i ++) {
    inserSomeUserInfo(i);
  }
  let eventItv = window.setInterval(insertSomeEvent, 1000);
  (<any>window).eventItv = eventItv;
  let userItv = window.setInterval(inserSomeUserInfo, 5000);
  (<any>window).userItv = userItv;
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
  let brush = _getTwoNums(`select low, high from currentFilter`);
  // console.log(getFormattedTime(all[0]), getFormattedTime(all[1]), getFormattedTime(brush[0]),   getFormattedTime(brush[1]));
  // console.log(all[0], all[1], brush[0], brush[1]);
  if ((brush[0] < all[0]) || (brush[1] > all[1])) {
    // throw new Error("values out of bounds");
    console.log("value out of bounds");
  }
  c.setTimelineState(all[0], all[1], brush[0], brush[1]);
  // let r3 = db.exec(`select * from allBrushes`);
  // TODO
}

export function setTableViewHelper(c: TableView) {
  // get visible tables
  // not very fancy and screen aware yet...
  let r = db.exec(`select * from filteredDataTableView`);
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

export function removeBrush(itxType = "userBrush") {
  db.run(`insert into itx (ts, low, high, itxType) values (${+Date.now()}, -1, -1, \'${itxType}\')`);
}

export function brushItx(low: number, high: number, relativeLow: number, relativeHigh: number, itxFixType: string) {
  db.run(`insert into itx (ts, low, high, relativeLow, relativeHigh, itxType, itxFixType) values (${+Date.now()}, ${low}, ${high}, ${relativeLow}, ${relativeHigh}, \'userBrush\', \'${itxFixType}\')`);
}
