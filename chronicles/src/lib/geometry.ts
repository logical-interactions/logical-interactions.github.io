
export interface Rect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function rectToString(selected: Rect) {
  return selected.x1.toString() + selected.x2.toString() + selected.y1.toString() + selected.y2.toString();
}