import * as React from "react";
import * as d3 from "d3";

interface StackProps {
  width: number;
  height: number;
}

// TODO: add some rendering effects
export default class Stack extends React.Component<StackProps, undefined> {

  render() {
    let { width, height } = this.props;
    let screenIcon = <g transform="matrix(0.5 0 0 0.5 0 0)"><path d="M95,14H5v60h40l-5,10h-5v2h30v-2h-5l-5-10h40V14z M93,72H7V16h86V72z"/></g>;
    let steps = ["interact", "request", "response", "rendering"];
    let unitHeight = height * 0.8 / steps.length;
    let paddingTop = height * 0.1;
    let boxHeight = 30;
    let boxes = steps.map((s, i) => {
      let x = 10;
      let y = unitHeight * i + paddingTop;
      let line = null;
      if (i < steps.length - 1) {
        line = (<line x1={x + 50} y1={y + boxHeight} x2={x + 50} y2={unitHeight * (i + 1) + paddingTop - 5} stroke="#000" stroke-width="3" marker-end="url(#arrow)" />
        );
      }
      return (<g>
        <rect x={x} y={y} width={100} height={boxHeight} fill={d3.schemeCategory10[i]} fillOpacity={0.3}>
        </rect>
        <text x={x + 10} y={y + 20} fontSize={20}>
          {s}
        </text>
        {line}
        </g>);
      });
    return(<svg height={height} width={width}>
      <defs>
      <marker id="arrow" viewBox="0 0 30 30" refX="1" refY="5"
          markerWidth="6" markerHeight="6" orient="auto">
        <path d="M 0 0 L 10 5 L 0 10 z" />
      </marker>
      </defs>
      {boxes}
    </svg>);
  }
}