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

interface EventsIllustrationState {
  step: number; // blocking, async, newest only
}

export default class EventsIllustration extends React.Component<EventsIllustrationProps, EventsIllustrationState> {
  static defaultProps = {
    width: 500,
    height: 100,
    marginBottom: 20,
    marginLeft: 20,
    marginRight: 20,
    marginTop: 20,
    maxSteps: 3,
  };

  constructor() {
    super(undefined);
    this.go = this.go.bind(this);
    this.state = {
      step: 0,
    };
  }

  go(step: number) {
    this.setState({
      step: step
    });
  }

  next() {
    this.go(this.state.step + 1);
  }

  back() {
    this.go(this.state.step - 1);
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
            .range([marginLeft, innerWidth]);
      events.forEach(e => {
        let node: JSX.Element;
        switch (e.event) {
        case Events.interaction:
          node = <circle cx={x(e.ts)} cy={marginTop} r={5} fill="blue"></circle>;
          break;
        case Events.render:
          node = <circle cx={x(e.ts)} cy={height - marginBottom} r={5} fill="green"></circle>;
          let itx = events.filter((e2) => {return e2.itxid === e.itxid; })[0];
          let line = <line x1={x(itx.ts)} y1={marginTop} x2={x(e.ts)} y2={height - marginBottom} strokeWidth={1} stroke={"black"} fillOpacity={0.5}></line>;
          correspondenceSvg.push(line);
          break;
        case Events.discard:
          node = <circle cx={x(e.ts)} cy={height - marginBottom - 10} r={5} fill="red"></circle>;
        }
        eventsSvg.push(node);
      });
    }
    let control = (<div>
      <button id="next_event" onClick={this.next} disabled={this.state.step === this.props.maxSteps}>next</button>
      <button id="next_event" onClick={this.back} disabled={this.state.step === 0}>previous</button>
    </div>);

    return (<div>
      <svg width={this.props.width} height={this.props.height}>
      <line x1={0} y1={marginTop} x2={innerWidth} y2={marginTop} strokeWidth={1} stroke={"black"} markerEnd="url(#triangle)"></line>
      <line x1={0} y1={height - marginBottom} x2={innerWidth} y2={height - marginBottom} strokeWidth={1} stroke={"black"} markerEnd="url(#triangle)"></line>
      {eventsSvg}
      {correspondenceSvg}
    </svg>
    </div>);
  }

}