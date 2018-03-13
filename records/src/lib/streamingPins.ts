// this is a helper of of MapZoomExplain
// where we execute some additional command to push in data to the db, and add a rendering scheme.
import { db } from "../records/setup";

import { getRandomInt } from "../lib/data";

let isStreaming = false;
let intervalId: number;

export function toggleStreaming() {
  // this is polling
  // make idempotent
  if (isStreaming) {
    console.log("Stopping streaming");
    isStreaming = false;
    window.clearInterval(intervalId);
  } else {
    isStreaming = true;
    console.log("Startin streaming");
    intervalId = window.setInterval(() => {
      // need to read the current map state
      // send it to server
      // when server responds, insert
      // here we are just mocking
      let r = db.exec(`
      SELECT
        m.latMin,
        m.latMax,
        m.longMin,
        m.longMax
      FROM
        newMapAndBrushState AS s
        INNER JOIN mapInteractions AS m ON s.mapItxId = m.itxId;`);
      if (r && r[0] && r[0].values) {
        let bounds = r[0].values[0] as number[];
        bounds.map(b => {
          if (isNaN(b)) {
            throw new Error("[MapZoomStream] Should be a number!");
          }
        });
        // emulate getting newer data about this region
        // random sample for now, though it doesn't make sense since it might be in ocean
        let data = Array.from({length: 5}, () => ({
          userId: (Math.random() + 1).toString(36).substring(7),
          lat: getRandomInt(bounds[0] * 10 , bounds[1] * 10) / 10,
          long: getRandomInt(bounds[2] * 10 , bounds[3] * 10) / 10
        }));
        let insertSQL = data.map(d => (`('${d.userId}', ${d.long}, ${d.lat})`)).join(",");
        console.log("inserting pins", insertSQL);
        // pinData is long and lat...
        db.exec(`
          INSERT INTO pinData VALUES ${insertSQL};
          INSERT INTO streamingData SELECT timeNow();
        `);
      }
    }, 2000);
  }
}