import { Coords, MapSelection } from "./data";

import * as d3 from "d3";
import { geoMercator, geoPath } from "d3-geo";

import { mapBoundsToTransform, SCALE, WIDTH, HEIGHT, Transform } from "../lib/data";

export function getTranslatedMapping(t: Transform) {
  return geoMercator()
          .scale(SCALE * t.k)
          .translate([WIDTH - t.x, HEIGHT - t.y]);
}

export function readFileSync(filename: string): string {
  let request = new XMLHttpRequest();
  request.open("GET", filename, false);  // `false` makes the request synchronous
  request.send(null);
  if (request.status === 200) {
    return request.responseText;
  } else {
    return "";
  }
}

export function readFileAsync(filename: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", filename, true);
    xhr.onload = () => resolve(xhr.responseText);
    xhr.onerror = () => reject(xhr.statusText);
    xhr.send();
  });
}

export const NW = [-173, 77];
export const SE = [163, -43];

export function checkBounds(controls: {[index: string]: boolean}, nw: Coords, se: Coords) {
  if (se[0] - nw[0] < 20) {
    // too close
    controls["in"] = true;
  }
  controls["left"] = nw[0] === NW[0];
  controls["right"] = se[0] === SE[0];
  controls["up"] = nw[1] === NW[1];
  controls["down"] = se[1] === SE[1];
  controls["out"] = ((JSON.stringify(nw) === JSON.stringify(NW)) && (JSON.stringify(se) === JSON.stringify(SE)));
  return controls;
}

export function interactionHelper(s: MapSelection, itxType: string) {
  if ((itxType === "in") || (itxType === "out")) {
    return zoomHelper(s, itxType);
  } else {
    return panHelper(s, itxType);
  }
}

export function panHelper(s: MapSelection, panType: string) {
  // move left by 20 percent
  let movement = [(s.se[0] - s.nw[0]) * 0.2, (s.nw[1] - s.se[1]) * 0.2];
  let mapping: {[index: string]: (p: Coords) => Coords} = {
    "left": (p: Coords) => [p[0] - movement[0], p[1]],
    "right": (p: Coords) => [p[0] + movement[0], p[1]],
    "up": (p: Coords) => [p[0], p[1] + movement[1]],
    "down": (p: Coords) => [p[0], p[1] - movement[1]],
  };
  let nw = mapping[panType](s.nw);
  let se = mapping[panType](s.se);
  ({nw, se} = clipToBounds({nw, se}));
  return {
    nw,
    se,
  };
}

export function zoomHelper(s: MapSelection, zoomType: string) {
  switch (zoomType) {
    case "in":
      return getInnerBox(s);
    case "out":
      return getOuterBox(s);
    default:
      throw new Error("zoom must be in or out");
  }
}

function getInnerBox(s: MapSelection) {
  let nw = [(5 * s.nw[0] + s.se[0]) / 6, (5 * s.nw[1] + s.se[1]) / 6 ];
  let se = [(s.nw[0] + 5 * s.se[0]) / 6, (s.nw[1] + 3 * s.se[1]) / 6 ];
  return {
    nw,
    se,
  };
}

function clipToBounds(s: MapSelection) {
  let {nw, se} = s;
  nw[0] = (nw[0] < NW[0]) ? NW[0] : nw[0];
  nw[1] = (nw[1] > NW[1]) ? NW[1] : nw[1];
  se[0] = (se[0] > SE[0]) ? SE[0] : se[0];
  se[1] = (se[1] < SE[1]) ? SE[1] : se[1];
  return {
    nw,
    se
  };
}

// some strange trasnformation math...
function getOuterBox(s: MapSelection) {
  let nw = [(5 * s.nw[0] - s.se[0]) / 4, (5 * s.nw[1] - s.se[1]) / 4] as Coords;
  let se = [(5 * s.se[0] - s.nw[0]) / 4, (5 * s.se[1] - s.nw[1]) / 4] as Coords;
  ({nw, se} = clipToBounds({nw, se}));
  return {nw, se};
}

// bind default value
export function bindDefault(o: any, d: any) {
  Object.keys(d).forEach(k => {
    if (!(k in o)) {
      o[k] = d[k];
    }
  });
  return o;
}