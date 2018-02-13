
export enum InteractionTypes {
  ZOOMMAP,
  BURSHBAR
}

export interface InteractionEntry {
  itxid: number;
  type: InteractionTypes;
  timestamp: Date;
  param: any;
}


export interface RequestEntry {
  itxid: number;
}


export interface ResponseEntry {
  itxid: number;
  data: any[]; // we can parametrize this later
}
