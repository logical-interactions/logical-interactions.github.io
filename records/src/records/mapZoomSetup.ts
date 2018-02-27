import { feature } from "topojson";
import * as d3ScaleChromatic from "d3-scale-chromatic";
import { geoMercator, geoPath } from "d3-geo";

import { db, executeFile } from "./setup";
import { getMapEventData, getUserhData, Coords, MapSelection,  mapBoundsToTransform, SCALE, WIDTH, HEIGHT } from "../lib/data";
import { getTranslatedMapping } from "../lib/helper";
// import { genSetMapStateTemp } from "../lib/helper";
import { PINS } from "../data/pins";
import { POP, MAXPOP } from "../data/pop";
import { Statement } from "sql.js";

export function setupMapDB() {
  // we need to wait for the UDFs to be loaded, trigger by the respective components
  executeFile("static");
  executeFile("mutations");
  executeFile("views");
  executeFile("dataFetchTriggers");
  executeFile("renderTriggers");
  executeFile("stateManagementTriggers");

  let insertPinResponse = db.prepare("INSERT INTO pinResponses (itxId, ts) VALUES (?, ?)");
  let insertPin = db.prepare("INSERT INTO pinData (itxId, long, lat) VALUES (?, ?, ?)");
  let insertUsernData = db.prepare("INSERT INTO userData (userId, Q1, Q2, Q3, Q4) VALUES (?, ?, ?, ?, ?);");

  function processPinResponse(response: any) {
    console.log("received response", response);
    const {selection, data, itxId} = response;
    db.exec("BEGIN TRANSACTION;");
    // also want to insert into pinResponse to indicate that we have values...
    // if it's here, it must be that the dataId is the same as interaction Id, that is, the same query was issued.
    data.forEach((d: any) => {
      d.unshift(itxId);
      insertPin.run(d);
    });
    insertPinResponse.run([itxId, +new Date()]);
    db.exec("COMMIT;");
  }

  function queryPin(itxId: number, latMin: number, latMax: number, longMin: number, longMax: number) {
    console.log("sending request for", itxId, latMin, latMax, longMin, longMax);
    getMapEventData(PINS, itxId, {nw: [longMin, latMax], se: [longMax, latMin]}).then(processPinResponse);
  }

  function queryUserData(itxId: number, userId: string) {
    getUserhData(itxId, userId).then(processUserDataResponse);
  }

  function processUserDataResponse(response: any) {
    // store it in the
    let {data, userId, itxid} = response;
    insertUsernData.run([userId, ...data]);
  }

  let UDFs: any[] = [queryPin, queryUserData];
  UDFs.forEach((f) => {
    db.create_function(f.name, f);
  });
}

export function setupCanvasDependentUDFs(ctx: CanvasRenderingContext2D) {

  // data needed for canvas drawing map
  // can always keep in the context
  let worldData: any[];
  fetch("/data/world.json")
  .then(response => {
    if (response.status !== 200) {
      console.log(`There was a problem: ${response.status}`);
      return;
    }
    response.json().then(worldDataRaw => {
      worldData = feature(worldDataRaw, worldDataRaw.objects.countries).features;
    });
  });

  // fixme: this seems a bit wasteful, but it would be automatically correct synchronization wise...
  // i wonder how expensive it actually is...
  function setPinState(latMin: number, latMax: number, longMin: number, longMax: number, long: number, lat: number) {
    let s = {
      nw: [longMin, latMax] as Coords,
      se: [longMax, latMin] as Coords
    };
    let t = mapBoundsToTransform(s, SCALE, WIDTH, HEIGHT);
    let p = getTranslatedMapping(t);
    // hard code for now
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(p([long, lat])[0], p([long, lat])[1], 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  function setMapState(latMin: number, latMax: number, longMin: number, longMax: number) {
    console.log("setting map state", arguments);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    let s = {
      nw: [longMin, latMax] as Coords,
      se: [longMax, latMin] as Coords
    };
    let t = mapBoundsToTransform(s, SCALE, WIDTH, HEIGHT);
    console.log("transformation for render", t);
    let p = getTranslatedMapping(t);
    let path = geoPath()
                .projection(p)
                .context(ctx);
    worldData.forEach((d, i) => {
      let colorVal = POP[d.id] ? Math.pow(POP[d.id] / MAXPOP, 0.4) * 0.6 + 0.1 : 0.2;
      ctx.fillStyle = d3ScaleChromatic.interpolateBlues(colorVal);
      ctx.beginPath();
      path(d);
      ctx.fill();
    });
  }

  let UDFs: any[] = [setPinState, setMapState];
  UDFs.forEach((f) => {
    db.create_function(f.name, f);
  });
}

// we cannot really call this from the engine since we are not sure if this is properly inserted into the DB...
// tho it would be weird to call this from the db though...
function evalView() {
  db.exec(`
    BEGIN TRANSACTION;
    SELECT * FROM renderMapState;
    SELECT * FROM renderPinState;
    COMMIT;
  `);
}


function getMapZoomStatements() {
  let stmts: {
    insertNavItx: Statement;
    insertBrushItx: Statement;
    insertBrushItxItems: Statement;
    brushItxDone: Statement;
    undoQuery: Statement;

  };
  return () => {
    if (!stmts) {
      stmts = {
        insertNavItx: db.prepare("INSERT INTO mapInteractions (ts, longMin, latMax, longMax, latMin) VALUES (?, ?, ?, ?, ?)"),
        insertBrushItx: db.prepare("INSERT INTO brushItx (ts) VALUES (?)"),
        insertBrushItxItems: db.prepare("INSERT INTO brushItxItems (ts, longMin, latMax, longMax, latMin) VALUES (?, ?, ?, ?, ?)"),
        brushItxDone: db.prepare("UPDATE currentBrushItx SET done = 1;"),
        undoQuery: db.prepare(`
        SELECT log('started', 'undo');
        UPDATE mapInteractions
          SET undoed = 1 WHERE itxId IN (SELECT itxId FROM mapInteractions ORDER BY itxId DESC LIMIT 1);
        INSERT INTO mapInteractions (ts, latMin, latMax, longMin, longMax, undoed)
          SELECT timeNow(), latMin, latMax, longMin, longMax, 2
          FROM mapInteractions
          WHERE undoed = 0
          ORDER BY itxId DESC LIMIT 1;
        UPDATE mapInteractions
          SET undoed = 1
          WHERE itxId IN (
            SELECT itxId
            FROM mapInteractions
            WHERE undoed = 0
            ORDER BY itxId DESC LIMIT 1);
        -- then set it back to 1
        UPDATE mapInteractions
          SET undoed = 0 WHERE undoed = 2;
      `),
      };
    }
    return stmts;
  };
}

export const stmts = getMapZoomStatements();
