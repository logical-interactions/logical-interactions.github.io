import * as d3 from "d3";
import { geoMercator } from "d3-geo";


export const SCALE = 1 << 6;
export const WIDTH = 800;
export const HEIGHT = 450;

const maxLatency = 4000;
const minLatency = 1000;
const dataLength = 4;

export interface Rect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
export interface Datum {
  x: number;
  y: number;
  error?: number;
}

export interface Transform {
  y: number;
  x: number;
  k: number;
}

export function approxEqual(a: number, b: number) {
  if (Math.abs(a - b) > Math.abs(a * 0.01)) {
    console.log("big diff", a, b);
  }
  return Math.abs(a - b) > Math.abs(a * 0.2);
}

export type MapEventsData = Coords;

export interface MapSelection {
  nw: Coords;
  se: Coords;
}
// by D3 standards...
export type Coords = [number, number];

export function mapBoundsToTransform(s: MapSelection, SCALE: number, WIDTH: number, HEIGHT: number) {
  if (!s) {
    throw new Error("Selection is null");
  }
  let p1 = geoMercator()
            .scale(SCALE)
            .translate([WIDTH / 2, HEIGHT / 2]);
  let pnw = p1(s.nw);
  let pse = p1(s.se);
  let dx = pse[0] - pnw[0];
  let dy = pse[1] - pnw[1];
  // reproject
  let k = 1 / Math.max(dx / WIDTH, dy / HEIGHT);
  let p2 = geoMercator().scale(SCALE * k).translate([WIDTH / 2, HEIGHT / 2]);
  pnw = p2(s.nw);
  pse = p2(s.se);
  let x = (pnw[0] + pse[0]) / 2;
  let y = (pnw[1] + pse[1]) / 2;
  // console.log("nw", s.nw, "sw", s.se, "input", SCALE, WIDTH, HEIGHT, "pnw", pnw, "pse", pse, "ratios", "transforms", k, x, y);
  if (isNaN(x) || isNaN(y) || isNaN(k)) {
    throw new Error("Transformations are invalid");
  }
  return {
    x,
    y,
    k
  };
}

export type MapDatum = [number, number, string];

export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// let mapData: MapEventsData[];
// load the data
export function getMapEventData(mapData: MapDatum[], itxId: number, s: MapSelection) {
  let delay = getRandomInt(minLatency, maxLatency);
  // FIXME filter based on selection and add determinstic details
  // console.log("reading mapData", mapData);
  let data = mapData.filter(d => (d[0] < s.nw[1]) && (d[0] > s.se[1]) && (d[0] < s.se[0]) && (d[1] > s.nw[0]));
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve({
      s,
      data,
      itxId,
    }), delay);
  });
}

export function getUserhData(itxid: number, userId: string) {
  // make it slightly longer than the other
  let delay = getRandomInt(minLatency, maxLatency) * 2;
  // fake data make up a bar chart based on the param
  let data: number[] = Array(dataLength).fill(4);
  for (let i = 0; i < userId.length; i ++) {
    data[i % dataLength] += userId.charCodeAt(i);
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve({
      data,
      userId,
      itxid,
    }), delay);
  });
}
