import * as d3 from "d3";

export interface MapEventsData {
  // eventId,deviceId,timestamp,longitude,latitude
  // eventId: string;
  // deviceId: string;
  // timestamp: string;
  long: number;
  lat: number;
}

export interface MapSelection {
  latMin: number;
  longMin: number;
  latMax: number;
  longMax: number;
}

export interface MapDatum {
  lat: number;
  long: number;
}

export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let mapData: MapEventsData[];
// load the data
export function getMapEventData(mapData: MapDatum[], itxid: number, selection: MapSelection, maxLatency?: number, minLatency?: number) {
  if (!maxLatency) {
    maxLatency = 4000;
    minLatency = 1000;
  }
  let delay = getRandomInt(minLatency, maxLatency);
  // FIXME filter based on selection and add determinstic details
  // console.log("reading mapData", mapData);
  let data = mapData;
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve({
      selection,
      data,
      itxid,
    }), delay);
  });
}
