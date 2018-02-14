import * as d3 from "d3";
import { geoMercator } from "d3-geo";

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

export type MapEventsData = Coords;
// {
//   // eventId,deviceId,timestamp,longitude,latitude
//   // eventId: string;
//   // deviceId: string;
//   // timestamp: string;
//   long: number;
//   lat: number;
// }

export interface MapSelection {
  nw: Coords;
  se: Coords;
  // latMin: number;
  // longMin: number;
  // latMax: number;
  // longMax: number;
}

// by D3 standards...
// [longitude, latitude]
export type Coords = [number, number];
// {
//   lat: number;
//   long: number;
// }

// export function mapPixelToGeo(p: d3.GeoProjection, k: number, x: number, y: number, nwP: [number, number], seP: [number, number]) {
//   let nw = p.invert(nwP);
//   let se = p.invert(seP);
//   let selection: MapSelection = {
//     nw,
//     se
//   };
//   // latMin: se[1],
//   // longMin: nw[0],
//   // latMax: nw[1],
//   // longMax: se[0]
//   return selection;
// }

export function mapBoundsToTransform(s: MapSelection, SCALE: number, WIDTH: number, HEIGHT: number) {
  let p1 = geoMercator()
            .scale( SCALE)
            .translate([WIDTH / 2, HEIGHT / 2]);
  let pnw = p1(s.nw);
  let pse = p1(s.se);
  let dx = pse[0] - pnw[0];
  let dy = pse[1] - pnw[1];
  // reproject
  let k = 1 / Math.max(dx / WIDTH, dy / HEIGHT);
  p1.scale(SCALE * k);
  pnw = p1(s.nw);
  pse = p1(s.se);
  let x = (pnw[0] + pse[0]) / 2;
  let y = (pnw[1] + pse[1]) / 2;
  return {
    x,
    y,
    k
  };
}

export interface MapDatum {
  lat: number;
  long: number;
}

export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// let mapData: MapEventsData[];
// load the data
export function getMapEventData(mapData: MapDatum[], itxid: number, s: MapSelection, maxLatency?: number, minLatency?: number) {
  if (!maxLatency) {
    maxLatency = 4000;
    minLatency = 1000;
  }
  let delay = getRandomInt(minLatency, maxLatency);
  // FIXME filter based on selection and add determinstic details
  // console.log("reading mapData", mapData);
  let data = mapData.filter(d => (d.lat < s.nw[1]) && (d.lat > s.se[1]) && (d.long < s.se[0]) && (d.long > s.nw[0]));
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve({
      s,
      data,
      itxid,
    }), delay);
  });
}

export function getBrushData(itxid: number, param: MapSelection, maxLatency?: number, minLatency?: number) {
  if (!maxLatency) {
    maxLatency = 4000;
    minLatency = 1000;
  }
  let delay = getRandomInt(minLatency, maxLatency);
  // fake  // make up a bar chart based on the param
  let data = param.nw.concat(param.se).map((d) => Math.round(Math.abs(d) * 100));
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve({
      param,
      data,
      itxid,
    }), delay);
  });
}
