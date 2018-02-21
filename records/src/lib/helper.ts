import { MapSelection } from "./data";

export function getMiddleHalf(s: MapSelection) {
  return {
    nw: [(3 * s.nw[0] + s.se[0]) / 4, (3 * s.nw[1] + s.se[1]) / 4 ],
    se: [(s.nw[0] + 3 * s.se[0]) / 4, (s.nw[1] + 3 * s.se[1]) / 4 ]
  };
}

export function getOuterBox(s: MapSelection) {
  return {
    nw: [3 * s.nw[0] + s.se[0], 3 * s.nw[1] + s.se[1]],
    se: [s.nw[0] + 3 * s.se[0], s.nw[1] + 3 * s.se[1]]
  };
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