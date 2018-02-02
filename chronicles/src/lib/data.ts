import { stocks } from "./stockData";
import { Rect } from "./geometry";
// import { flightData } from "./flightData";
export interface Datum {
  x: number;
  y: number;
  error?: number;
}

export interface XFilterDatum {
  [index: string]: number;
}

export interface XFilterSelection {
  [index: string]: [number, number];
}

export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const facetValues = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function getStockData(selection: string) {
  let stock = stocks[1];
  let offset = facetValues.indexOf(selection);
  let result = [];
  for (let i: number = 0; i < 5; i ++) {
    result.push({x: i + 2008, y: stock[i][offset]});
  }
  // console.log("result", result);
  return result;
}

export function getData(selection: string, avgDelay: number, varDelay: number, itxid: number, progressiveCount: number) {
  let data = getStockData(selection);
  if (progressiveCount > 0) {
     // map data with error info, assume max is 5, hack
     data = data.map((d) => { return {
      x: d.x,
      y: d.y,
      error: (9 - progressiveCount) * 0.1 * Math.random() * d.y,
     };
    });
    // console.log("your progressive data is", data);
  }
  return new Promise((resolve, reject) => {
    let delay = getRandomInt(avgDelay - varDelay, avgDelay + varDelay);
    setTimeout(
      () => resolve({selection: selection, data, itxid}),
      delay
    );
  });
}

export function getScatterData(count: number) {
  // TODO: randomize
  let result: Datum[] = [];
  for (let i = 0; i < count; i ++) {
    result.push({x: getRandomInt(0, 100), y: Math.abs(Math.round((randn_bm() * 10 + 50) * 100) / 100 % 100)});
  }
  return result;
}

export function filterZoomData(originalData: Datum[], selection: Rect, key: number, avgDelay: number, varDelay: number) {
  let data = originalData.filter((d) => {return (d.x < selection.x2) && (d.x > selection.x1) && (d.y < selection.y2) && (d.y > selection.y1); });
  return new Promise((resolve, reject) => {
    let delay = getRandomInt(avgDelay - varDelay, avgDelay + varDelay);
    setTimeout(
      () => resolve({selection: selection, data, key}),
      delay
    );
  });
}

// Standard Normal variate using Box-Muller transform.
function randn_bm() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

// generates some random values for c
export function getFlightData() {
  let r: XFilterDatum[] = [];
  for (let i = 0; i < 2000; i ++) {
    const a = Math.round(randn_bm() * 100 + 100); // gaussian
    const b = Math.round(a * (Math.random() / 2 + 0.5)); // create some correlation
    const c = Math.round(Math.random() * 100);
    r.push({
      a,
      b,
      c
    });
  }
  return r;
}

export function filterFlightData(sourceData: XFilterDatum[], s: XFilterSelection, key: number, allKeys: string[], avgDelay: number, varDelay: number) {
  let keys = Object.keys(s);
  let data: any = {};
  allKeys.forEach((k1, i) => {
    let subData = sourceData.filter(e => {
      let out = 0;
      keys.forEach((k) => {
        if (k !== k1) {
          if ((e[k] > s[k][1]) || (e[k] < s[k][0])) {
            // console.log("filtered out", e[k]);
            out += 1;
            return false;
          }
        }
      });
      if (out === 0) {
        return true;
      } else {
        return false;
      }
    });
    console.log("adding data", k1);
    data[k1] = subData;
  });
  console.log("Filtered data", data, "original is", sourceData);
  return new Promise((resolve, reject) => {
    let delay = getRandomInt(avgDelay - varDelay, avgDelay + varDelay);
    setTimeout(
      () => resolve({selection: s, data, key}),
      delay
    );
  });
}