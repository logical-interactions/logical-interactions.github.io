import * as React from "react";
import * as d3 from "d3";
// import * as d3ScaleChromatic from "d3-scale-chromatic";
import { Arrow, Node, NodeType, makeSvg } from "../lib/diagram";

export enum InteractionStep {
  UserInput,
  Processing,
  Result,
}

interface ModelProps {
  width: number;
  height: number;
  startStep?: number;
  hightlight?: string; // node number
}

interface ModelState {
  step: number;
}

// TODO: add some rendering effects
export default class Model extends React.Component<ModelProps, ModelState> {
  constructor(props: ModelProps) {
    super(props);
    this.nextStep = this.nextStep.bind(this);
    this.state = {
      step: props.startStep ? props.startStep : 1
    };
  }

  nextStep() {
    this.setState(prevState => {
      return {
        step: prevState.step + 1
      };
    });
  }

  render() {
    let { width, height } = this.props;
    let screenIcon = <g transform="matrix(0.5 0 0 0.5 0 0)"><path d="M95,14H5v60h40l-5,10h-5v2h30v-2h-5l-5-10h40V14z M93,72H7V16h86V72z"/></g>;
    let steps = ["user input", "processing", "result"];
    let unitHeight = height * 0.8 / steps.length;
    let paddingTop = height * 0.1;
    let boxHeight = 30;
    let nodes: {[index: string]: Node} = {};
    let arrows: Arrow[];
    let explainText = "All interactions consists of" + steps.join(", ") + ", for example, when you are zooming into a region of a map, you have to click on the position and drag the mouse, forming a sequence of 'mousedown, mousemove, mousemove..., mouseup'.  Then to process, the client could load the results 'immediately' (with human-negalible input), or the client could send to server for processing (e.g., Google Maps panning), and render the results at a later time.  This is a natural way to split an interaction both in terms of functionality, initiating agent, and time segments.\n\n";
    steps.map((s, i) => {
      let x = 10;
      let y = unitHeight * i + paddingTop;
      let line = null;
      nodes[s] = {
        type: NodeType.Rect,
        x1: x,
        x2: x + 100,
        y1: y,
        y2: y + boxHeight,
        text: s,
        fill: d3.schemeCategory10[i],
        fillOpacity: 0.3
      };
    });
    arrows.push({
      start: "interact",
      end: "request",
    });
    arrows.push({
      start: "request",
      end: "response",
    });
    if (this.state.step > 1) {
      explainText += "";
      // show the write
      steps.map((s, i) => {
        let x = 200;
        let y = unitHeight * i + paddingTop;
        nodes[s + "_component"] = {
          type: NodeType.Rect,
          x1: x,
          x2: x + 100,
          y1: y,
          y2: y + boxHeight,
          text: "<component>",
          fill: d3.schemeCategory10[i],
          fillOpacity: 0.3
        };
      });
      arrows.push({
        start: "interact",
        end: "interact_component",
      });
      arrows.push({
        start: "response",
        end: "response_component",
      });
    }

    if (this.state.step > 2) {
      // show the interleaving
    }

    if (this.state.step > 3) {
      // show the single policy
    }

    if (this.state.step > 4) {
      // show the read
    }

    return(<>
    <svg height={height} width={width} style={{float: "left"}}>
      <defs>
      <marker id="arrow" viewBox="0 0 30 30" refX="1" refY="5"
          markerWidth="6" markerHeight="6" orient="auto">
        <path d="M 0 0 L 10 5 L 0 10 z" />
      </marker>
      </defs>
      { makeSvg(nodes, arrows) }
    </svg>
    <p style={{float: "left"}}>
      {explainText}
    </p>
    <button onClick={this.nextStep}>next</button></>);
  }
}