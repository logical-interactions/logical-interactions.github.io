import { stocks } from "./stockData";

export interface Datum {
  x: number;
  y: number;
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
