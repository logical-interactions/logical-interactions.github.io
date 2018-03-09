import * as React from "react";
import * as d3 from "d3";

import { checkBounds, interactionHelper, getTranslatedMapping } from "../lib/helper";
import { db } from "../records/setup";
import { setupMapDB, getMapZoomStatements, setupCanvasDependentUDFs } from "../records/MapZoom/setup";
import { MapSelection, getRandomInt, Rect, Coords, mapBoundsToTransform, approxEqual, SCALE, WIDTH, HEIGHT } from "../lib/data";

interface MapZoomProps {
  logical: boolean;
  width?: number;
  height?: number;
  maxLatency?: number;
  minLatency?: number;
  debuging?: boolean;
}

interface MapZoomState {
  // brushItxId: number;
  // navItxId: number;
  intendedNavSelection: MapSelection;
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
    width: 720,
    height: 450,
    maxLatency: 4000,
    minLatency: 1000,
  };

  constructor(props: MapZoomProps) {
    super(props);
    this.setMapPending = this.setMapPending.bind(this);
    this.setMapBounds = this.setMapBounds.bind(this);
    this.interact = this.interact.bind(this);
    this.state = {
      shiftDown: false,
      navSelection: null,
      intendedNavSelection: null,
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

  setMapPending(pending: number) {
    console.log("PIN PENDING", pending);
    this.setState({
      pending: (pending > 0) ? false : true
    });
  }

  setMapBounds(latMin: number, latMax: number, longMin: number, longMax: number) {
    let navSelection = {
      nw: [longMin, latMax] as Coords,
      se: [longMax, latMin] as Coords
    };
    if (this.state.intendedNavSelection) {
      this.setState({
        navSelection,
      });
    } else {
      // if this is initializing then sync navSelection and intendedNavSelection
      this.setState({
        navSelection,
        intendedNavSelection: navSelection,
      });
    }
  }

  handleKeyDown(event: any) {
    // Cmd+Z
    let stmts = getMapZoomStatements();
    if ((event.metaKey) && (event.keyCode === 90)) {
      stmts.undoQuery.run();
    }
  }

  componentDidMount() {
    const canvas = this.refs.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    // do all the setup here
    // functions must be defined before view references them
    setupCanvasDependentUDFs(ctx);
    db.create_function("setMapPending", this.setMapPending);
    db.create_function("setMapBounds", this.setMapBounds);
    // now pass this canvas reference to draw dots on!
    // db.create_function("setMapState", this.setMapState);
    window.addEventListener("keydown", this.handleKeyDown);
    // window.addEventListener("keyup", this.handleKeyUp);
    // creates a handle to update this component

  }

  // so our undo redo logic will by similar to others (checked with Sublime), where a branch is lost from the linear path forward (much like how copy paste's clip board copy is gone after a second copy)

  interact(itxType: string) {
    return() => {
      let navSelection = this.props.logical ? this.state.navSelection : this.state.intendedNavSelection;
      let {nw, se} = interactionHelper(navSelection, itxType) as {nw: Coords, se:  Coords };
      let stmts = getMapZoomStatements();
      let controlsDisabledOld = Object.assign({}, this.state.controlsDisabled);
      let controlsDisabled = checkBounds(controlsDisabledOld, nw, se);
      // also if this.state.navSeletion is null, disable
      if (!navSelection) {
        Object.keys(controlsDisabled).forEach((key) => {
          controlsDisabled[key] = true;
        });
      }
      if (JSON.stringify(controlsDisabled) !== JSON.stringify(this.state.controlsDisabled)) {
        this.setState({controlsDisabled});
      }
      this.setState({
        intendedNavSelection: {nw, se}
      });
      stmts.insertNavItx.run([+new Date(), ...nw, ...se]);
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
                      let stmts = getMapZoomStatements();
                      stmts.insertBrushItx.run([+new Date()]);
                    })
                    .on("end", function() {
                      let stmts = getMapZoomStatements();
                      const s = d3.brushSelection(this) as [[number, number], [number, number]];
                      if (s !== null) {
                        let nw = p.invert(s[0]);
                        let se = p.invert(s[1]);
                        stmts.insertBrushItxItems.run([+new Date(), ...nw, ...se]);
                      }
                    });
      brushDiv = <g ref={ g => d3.select(g).call(brush) }></g>;
    }
    let controls = ["in", "out", "left", "right", "up", "down"].map((c) => <button onClick={this.interact(c)} disabled={controlsDisabled[c]}>{c}</button>);
    let pendingSvg: JSX.Element;
    if (pending) {
      console.log("showing as pending");
      pendingSvg = <div className="indicatorLine"></div>;
    }
    return(<>
      {controls}
      <div style={{position: "relative", height: HEIGHT, width: WIDTH}}>
        {pendingSvg}
        <canvas style={{position: "absolute"}} ref="canvas" width={WIDTH} height={HEIGHT} />
        <svg style={{position: "absolute"}} width={WIDTH} height={HEIGHT}>
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