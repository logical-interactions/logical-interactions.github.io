
import * as d3 from "d3";
import { db, executeFile } from "../setup";

export function setupXFilterDB() {
  // date,delay,distance,origin,destination
  let insertData = db.prepare(`INSERT INTO flight VALUES (?, ?, ?, ?, ?)`);
  d3.text("/data/flights.json", function(error, _data) {
    db.exec("BEGIN TRANSACTION;");
    let arrays = d3.csvParseRows(_data);
    arrays.forEach(d => {
      insertData.run(d);
    });
    db.exec("COMMIT;");
  });
}
