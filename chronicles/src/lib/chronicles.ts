import * as d3ScaleChromatic from "d3-scale-chromatic";
import * as d3 from "d3";

interface Scales {
  [idx: string]: (b: number, id?: number) => (i: number) => string;
}
// these need to be strings to work with buttons nicely

// export enum ColorEncoding {
//   Multiple,
//   Blue
// }

// export enum Encoding {
//   Position,
//   Color,
// }

// export enum Widget {
//   Facet,
//   Brush
// }

/**
 * Generates the color scales used for differentiating recently used
 * results on screen.
 * @param {number} bufferSize
 * @param {number} interactionId?
 */
export const ColorScales: Scales = {
  BLUE(bufferSize: number, evictedIdx?: number) {
    if (bufferSize === 1) {
      return () => d3ScaleChromatic.interpolateBlues(0.8);
    }
    return (i: number) => {
      let offset = i;
      if (evictedIdx !== undefined) {
        // this offset ensures that the color doesn't move around
        offset = (evictedIdx - i + bufferSize) % bufferSize;
      }
      // the closer to 1, the darker
      // so the smaller the offset, the darker
      return d3ScaleChromatic.interpolateBlues(0.8 - 0.6 * offset / (bufferSize - 1));
    };
  },
  MULTI(bufferSize: number, evictedIdx?: number) {
    if (bufferSize === 1) {
      return () => d3.schemeCategory20[0];
    }
    return (i: number) => {
      let offset = i;
      if (evictedIdx !== undefined) {
        // this offset ensures that the color doesn't move around
        offset = (evictedIdx - i + bufferSize) % bufferSize;
      }

      // since the 20 contains pairs of close ones, use the even ones when possible.
      if (offset < 10) {
        offset *= 2; // use even so we don't have similar colors
      } else {
        // use odd colors
        offset = (offset - 9) * 2 - 1;
      }
      return d3.schemeCategory20[offset];
    };
  },
};