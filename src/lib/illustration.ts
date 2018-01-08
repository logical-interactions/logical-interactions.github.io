
export enum Events {
  cached, // interaction on a cached item
  interaction, // interaction on a new item
  requesting, // interaction on a currently requesting item
  discard, // discarded response data
  render, // rendered response data
}

export interface EventLog {
  event: Events;
  selection: string;
  itxid: number;
  ts: number;
}