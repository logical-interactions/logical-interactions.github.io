// this is a helper of of MapZoomExplain
// where we execute some additional command to push in data to the db, and add a rendering scheme.
import { db } from "../records/setup";

import { getRandomInt } from "../lib/data";

let isStreaming = false;

export function toggleStreaming() {
  // this is polling
  // make idempotent
  if (isStreaming) {
    console.log("Map pins already streaming");
  }
  setInterval(() => {
    // need to read the current map state
    // send it to server
    // when server responds, insert
    // here we are just mocking
    let r = db.exec(`SELECT * FROM newMapAndBrushState`);
    if (r && r[0] && r[0].values) {
      let bounds = r[0].values[0] as number[];
      // emulate getting newer data about this region
      // random sample for now, though its bad
      let data = Array.from({length: 20}, () => ({
        userId: (Math.random() + 1).toString(36).substring(7),
        lat: getRandomInt(bounds[2] * 10 , bounds[3] * 10) / 10,
        long: getRandomInt(bounds[4] * 10 , bounds[5] * 10) / 10
      }));
      db.exec(`INSERT INTO pinData VALUES ${data.map(d => (`('${d.userId}', ${d.lat}, ${d.long})`)).join(",")};`);
    }
  }, 2000);
}