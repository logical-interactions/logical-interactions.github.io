import * as d3 from "d3";
import * as React from "react";

import { EventLog, Events } from "../lib/illustration";

interface EventsIllustrationProps {
  events: EventLog[];
  design: string;
  width?: number;
  height?: number;
  maxSteps?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
}

// interface EventsIllustrationState {
//   step: number; // blocking, async, newest only
// }

export default class EventsIllustration extends React.Component<EventsIllustrationProps, undefined> {
  static defaultProps = {
    width: 500,
    height: 100,
    marginBottom: 20,
    marginLeft: 80,
    marginRight: 20,
    marginTop: 20,
    maxSteps: 3,
  };

  constructor() {
    super(undefined);
  }

  render() {
    let { events, width, height, marginBottom, marginLeft, marginRight, marginTop } = this.props;
    const innerWidth = width - marginLeft - marginRight;
    const innerHeight = height - marginTop - marginBottom;
    let eventsSvg: JSX.Element[] = [];
    let correspondenceSvg: JSX.Element[] = [];
    if (events && (events.length > 0)) {
      let x = d3.scaleTime()
            .domain([events[0].ts, events[events.length - 1].ts])
            .range([marginLeft, innerWidth - 10]);
      events.forEach(e => {
        let node: JSX.Element;
        switch (e.event) {
        case Events.interaction:
          node = <circle cx={x(e.ts)} key={e.ts} cy={marginTop} r={5} fill="blue"></circle>;
          break;
        case Events.render:
          node = <circle cx={x(e.ts)} key={e.ts} cy={height - marginBottom} r={5} fill="green"></circle>;
          let temp = events.filter((e2) => (e2.itxid === e.itxid) && (e2.event === Events.interaction));
          if (temp.length > 1) {
            debugger;
            throw new Error();
          }
          if (temp.length > 0) {
            let itx = temp[0];
            // console.log("itxid", e.itxid, "selections", itx.selection);
            let line = <line key={e.ts} x1={x(itx.ts)} y1={marginTop} x2={x(e.ts)} y2={height - marginBottom} data-itxid={e.itxid} strokeWidth={1} stroke={"black"} fillOpacity={0.5}></line>;
            correspondenceSvg.push(line);
          }
          break;
        case Events.discard:
          node = <text key={e.ts} x={x(e.ts)} y={height - marginBottom - 10} fontSize={15} fill="red">X</text>;
          break;
        case Events.blocked:
          node = <text key={e.ts} x={x(e.ts)} y={marginTop} fontSize={15} fill="red">X</text>;
          break;
        }
        eventsSvg.push(node);
      });
    }

    return (<div>
      <svg width={this.props.width} height={this.props.height}>
        <defs>
          <marker id="triangle" viewBox="0 0 10 10" refX="1" refY="5"
              markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        <line x1={marginLeft} y1={marginTop} x2={innerWidth} y2={marginTop} strokeWidth={1} stroke={"black"} markerEnd={"url(#triangle)"}></line>
        <text x={0} y ={marginTop} fontSize={14}>requests</text>
        <line x1={marginLeft} y1={height - marginBottom} x2={innerWidth} y2={height - marginBottom} strokeWidth={1} stroke={"black"} markerEnd="url(#triangle)"></line>
        <text x={0} y ={height - marginBottom} fontSize={14}>responses</text>
        {eventsSvg}
        {correspondenceSvg}
      </svg>
    </div>);
  }

}