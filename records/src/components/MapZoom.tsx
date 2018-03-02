import * as React from "react";
import * as d3 from "d3";

import { checkBounds, interactionHelper, getTranslatedMapping } from "../lib/helper";
import { db } from "../records/setup";
import { stmts, setupCanvasDependentUDFs } from "../records/MapZoom/setup";
import { MapSelection, getRandomInt, Rect, Coords, mapBoundsToTransform, approxEqual, SCALE, WIDTH, HEIGHT } from "../lib/data";

interface MapZoomProps {
  width?: number;
  height?: number;
  maxLatency?: number;
  minLatency?: number;
  debuging?: boolean;
}

interface MapZoomState {
  // brushItxId: number;
  // navItxId: number;
  pending: boolean;
  navSelection: MapSelection;
  shiftDown: boolean;
  // pins: PinState;
  controlsDisabled: {[index: string]: boolean};
  // worldData: any[];
}


export default class MapZoom extends React.Component<MapZoomProps, MapZoomState> {
  svg: SVGElement;
  button: HTMLButtonElement;
  static defaultProps = {
    debuging: true,
    width: 800,
    height: 450,
    maxLatency: 4000,
    minLatency: 1000,
  };

  constructor(props: MapZoomProps) {
    super(props);
    this.setMapPending = this.setMapPending.bind(this);
    this.setMapBounds = this.setMapBounds.bind(this);
    this.interact = this.interact.bind(this);
    db.create_function("setMapPending", this.setMapPending);
    db.create_function("setMapBounds", this.setMapBounds);
    this.state = {
      shiftDown: false,
      navSelection: null,
      controlsDisabled: {
        "in": false,
        "out": false,
        "left": false,
        "right": false,
        "up": false,
        "down": false,
        "brush": false,
      },
      pending: false,
      // worldData: [],
    };
  }

  setMapPending(pending: boolean) {
    this.setState({
      pending
    });
  }
  setMapBounds(latMin: number, latMax: number, longMin: number, longMax: number) {
    let navSelection = {
      nw: [longMin, latMax] as Coords,
      se: [longMax, latMin] as Coords
    };
    this.setState({
      navSelection,
    });
  }

  handleKeyDown(event: any) {
    // Cmd+Z
    if ((event.metaKey) && (event.keyCode === 90)) {
      stmts().undoQuery.run();
    }
  }

  componentDidMount() {
    const canvas = this.refs.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    setupCanvasDependentUDFs(ctx);
    // now pass this canvas reference to draw dots on!
    // db.create_function("setMapState", this.setMapState);
    window.addEventListener("keydown", this.handleKeyDown);
    // window.addEventListener("keyup", this.handleKeyUp);
    // creates a handle to update this component

  }

  // so our undo redo logic will by similar to others (checked with Sublime), where a branch is lost from the linear path forward (much like how copy paste's clip board copy is gone after a second copy)

  interact(itxType: string) {
    return() => {
      let {nw, se} = interactionHelper(this.state.navSelection, itxType);
      let controlsDisabledOld = Object.assign({}, this.state.controlsDisabled);
      let controlsDisabled = checkBounds(controlsDisabledOld, nw as Coords, se as Coords);
      // also if this.state.navSeletion is null, disable
      if (!this.state.navSelection) {
        Object.keys(controlsDisabled).forEach((key) => {
          controlsDisabled[key] = true;
        });
      }
      if (JSON.stringify(controlsDisabled) !== JSON.stringify(this.state.controlsDisabled)) {
        this.setState({controlsDisabled});
      }
      stmts().insertNavItx.run([+new Date(), ...nw, ...se]);
    };
  }

  render() {
    let { width, height } = this.props;
    let { controlsDisabled, pending } = this.state;
    let brushDiv: JSX.Element;
    if (this.state.navSelection) {
      let t = mapBoundsToTransform(this.state.navSelection, SCALE, WIDTH, HEIGHT);
      // console.log("transformation for render", t);
      // makes more sense to use svg since the brush wouldn't cause a canvas redraw
      // this is really better than the SQL all in approach.
      let p = getTranslatedMapping(t);
      let brush = d3.brush()
                    .extent([[0, 0], [innerWidth, innerHeight]])
                    .on("start", function() {
                      stmts().insertBrushItx.run([+new Date()]);
                    })
                    .on("end", function() {
                      const s = d3.brushSelection(this) as [[number, number], [number, number]];
                      if (s !== null) {
                        let nw = p.invert(s[0]);
                        let se = p.invert(s[1]);
                        stmts().insertBrushItxItems.run([+new Date(), ...nw, ...se]);
                      }
                    });
      brushDiv = <g ref={ g => d3.select(g).call(brush) }></g>;
    }
    let controls = ["in", "out", "left", "right", "up", "down"].map((c) => <button onClick={this.interact(c)} disabled={controlsDisabled[c]}>{c}</button>);
    let pendingSvg: JSX.Element;
    if (pending) {
      console.log("showing as pending");
      pendingSvg = <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="black" opacity="0.1" />;
    }
    return(<>
      {controls}
      <div style={{position: "relative", height: HEIGHT, width: WIDTH}}>
        <canvas style={{position: "absolute"}} ref="canvas" width={WIDTH} height={HEIGHT} />
        <svg style={{position: "absolute"}} width={WIDTH} height={HEIGHT}>
          {pendingSvg}
          {brushDiv}
        </svg>
      </div>
      <button>Show Me Where I've Been</button>
      <button>Export Selected User Ids</button>
      <button>Animate Where I've been</button>
      <button>Clear Cache</button>
      <button>Stream Data</button>
    </>);
  }
}