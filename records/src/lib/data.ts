import * as d3 from "d3";
import { geoMercator } from "d3-geo";

import { PINS } from "../data/pins";

export const SCALE = 1 << 6;
export const WIDTH = 700;
export const HEIGHT = 400;

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


let latencies: {[index: string]: {min: number, max: number} } = {
  pin: {
    max: 4000,
    min: 1000
  },
  user: {
    max: 4000,
    min: 3000
  }
};

// hacky
// do not want to refresh MapZoom
export function mapZoomLatency(key: string, min?: number, max?: number) {
  if (Object.keys(latencies).indexOf(key) < 0) {
    throw new Error(`[getLatency] ${key} not found, ${ Object.keys(latencies)}`);
  }
  if (min > max) {
    throw new Error(`[getLatency] min(${min}) must be smaller than max(${max}) `);
  }
  if (min && max) {
    latencies[key] = {min, max};
  }
  return latencies[key];
}

// let mapData: MapEvents  Data[];
// load the data
export function getMapEventData(itxId: number, s: MapSelection) {
  let l = mapZoomLatency("pin");
  let delay = getRandomInt(l.min, l.max);
  // FIXME filter based on selection and add determinstic details
  let data = PINS.filter(d => {
    if ((d[1] < s.nw[1]) && (d[1] > s.se[1]) && (d[0] < s.se[0]) && (d[0] > s.nw[0])) {
      return true;
    }
    return false;
  });
  // console.log("filtered result", data, PINS, s);
  // hack, to avoid hanging and having no result...
  if (data.length === 0) {
    data = [[0, 0, "dummy"]];
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve({
      s,
      data,
      itxId,
    }), delay);
  });
}

export function getUserData(userId: string) {
  // make it slightly longer than the other
  let l = mapZoomLatency("user");
  let delay = getRandomInt(l.min, l.max);
  // fake data make up a bar chart based on the param
  let data: number[] = Array(dataLength).fill(4);
  for (let i = 0; i < userId.length; i ++) {
    data[i % dataLength] += userId.charCodeAt(i);
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve({
      data,
      userId,
    }), delay);
  });
}
