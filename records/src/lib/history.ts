import { MapDatum, Rect, MapSelection } from "./data";

export enum InteractionTypes {
  ZOOMMAP,
  BURSHBAR
}

export interface InteractionEntry {
  itxId: number;
  type: InteractionTypes;
  timestamp: Date;
  param: MapSelection;
  writeState?: any;
}

export interface Transform {
  y: number;
  x: number;
  k: number;
}


export interface PinState {
   // basically the pins!
   // always some interaction ID that caused this
   itxId: number;
   data: MapDatum[];
}

export interface BrushState {
  itxId: number;
  selection: MapSelection;
}

export interface RequestEntry {
  itxid: number;
}


export interface ResponseEntry {
  itxid: number;
  data: any[]; // we can parametrize this later
}
