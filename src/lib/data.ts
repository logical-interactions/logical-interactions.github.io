import { stocks } from "./stockData";
import { Rect } from "./geometry";
import { flightData } from "./flightData";
export interface Datum {
  x: number;
  y: number;
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

export function getData(selection: string, avgDelay: number, varDelay: number, itxid: number) {
  let data = getStockData(selection);
  return new Promise((resolve, reject) => {
    let delay = getRandomInt(avgDelay - varDelay, avgDelay + varDelay);
    setTimeout(
      () => resolve({selection: selection, data, itxid}),
      delay
    );
  });
}

export function getScatterData(rawArray: number[]) {
  // TODO: randomize
  let result: Datum[] = [];
  for (let i = 0; i < rawArray.length - 1; i ++) {
    result.push({x: rawArray[i], y: rawArray[i + 1] * 2 % 100});
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

// generates some random values for c
export function getFlightData() {
  let r: XFilterDatum[] = [];
  for (let i = 0; i < flightData.length; i ++) {
    let e = flightData[i];
    const randNum = Math.round(Math.random() * 100);
    r.push({
      a: e.a,
      b: e.b,
      c: randNum
    });
  }
  return r;
}

export function filterFlightData(sourceData: XFilterDatum[], s: XFilterSelection, key: number, avgDelay: number, varDelay: number) {
  let data = sourceData.filter(e => {
   let keys = Object.keys(s);
   let out = 0;
    keys.forEach((k) => {
      console.log("filtering", e[k], s[k][1], s[k][0]);
      if ((e[k] > s[k][1]) || (e[k] < s[k][0])) {
        console.log("filtered out", e[k]);
        out += 1;
        return false;
      }}
    );
    if (out === 0) {
      return true;
    } else {
      return false;
    }
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