import { MapDatum, Rect, MapSelection } from "./data";

export enum InteractionTypes {
  ZOOMMAP,
  BURSHBAR
}

export interface InteractionEntry {
  itxid: number;
  type: InteractionTypes;
  timestamp: Date;
  param: any;
  writeState: any;
}

export interface MapState {
  // since the world map data is available globally there is no need to record it here
  itxId: number;
  selection: MapSelection;
  // transform: {
  //   y: number;
  //   x: number;
  //   k: number;
  // };
}

export interface PinState {
   // basically the pins!
   // always some interaction ID that caused this
   itxId: number;
   data: MapDatum[];
}

export interface BrushState {
  itxId: number;
  selection: Rect;
}

export interface RequestEntry {
  itxid: number;
}


export interface ResponseEntry {
  itxid: number;
  data: any[]; // we can parametrize this later
}
