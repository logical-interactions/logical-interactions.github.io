import * as React from "react";

export enum NodeType {
  Rect,
  Circle,
}

export interface Node {
  type: NodeType; x1: number; y1: number; x2: number; y2: number; text?: string; fill?: string; fillOpacity?: number;
}

export interface Arrow {
  start: string;
  end: string;
}

const loadingHandler = () => (<p>hi</p>);

export function makeSvg(nodes: {[index: string]: Node}, arrows: Arrow[], highlight?: string) {
  let svgs: JSX.Element[] = [];
  for (let key in nodes) {
    let n = nodes[key];
    let g: JSX.Element[];
    switch (n.type) {
      case NodeType.Rect:
        g.push(<rect x={n.x1} y={n.y1} width={n.x2 - n.x1} height={n.y2 - n.y1} fill={n.fill} fillOpacity={n.fillOpacity}></rect>);
        if (n.text) {
          g.push(<text x={n.x1 + 10} y={n.y1 + 20} fontSize={20}>{n.text}</text>);
        }
        let className = "";
        if (key === highlight) {
          className = "pulseAction";
        }
        svgs.push(<g className={className}>{g}</g>);
    }
  }
  arrows.forEach(a => {
    svgs.push(<line x1={nodes[a.start].x2} y1={nodes[a.start].y2} x2={nodes[a.end].x1} y2={nodes[a.end].y2} stroke="#000" stroke-width="3" marker-end="url(#arrow)" />
    );
  });
  return svgs;
}