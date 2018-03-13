import * as React from "react";
import * as d3 from "d3";

import { checkBounds, interactionHelper, getTranslatedMapping } from "../lib/helper";
import { db, downloadDB, downloadQueryResultAsCSV, loadDb } from "../records/setup";
import { getMapZoomStatements, setupCanvasDependentUDFs, showPastMapBrushes, replayBackwardsSession, removeCacheSQL } from "../records/MapZoom/setup";
import { MapSelection, getRandomInt, Rect, Coords, mapBoundsToTransform, approxEqual } from "../lib/data";
import { toggleStreaming } from "../lib/streamingPins";
import Chart from "./Chart";

interface MapZoomProps {
  logical: boolean;
  width?: number;
  height?: number;
  scale?: number;
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
  replayIntervalId: number;
  streaming: boolean;
  // worldData: any[];
}


export default class MapZoom extends React.Component<MapZoomProps, MapZoomState> {
  svg: SVGElement;
  button: HTMLButtonElement;
  static defaultProps = {
    debuging: true,
    width: 720,
    height: 450,
    scale: 1 << 6,
    maxLatency: 4000,
    minLatency: 1000,
  };

  constructor(props: MapZoomProps) {
    super(props);
    this.setMapPending = this.setMapPending.bind(this);
    this.setMapBounds = this.setMapBounds.bind(this);
    this.interact = this.interact.bind(this);
    this.replay = this.replay.bind(this);
    this.handleStreaming = this.handleStreaming.bind(this);
    this.setReplayIntervalNull = this.setReplayIntervalNull.bind(this);
    this.state = {
      replayIntervalId: null,
      shiftDown: false,
      navSelection: null,
      streaming: false,
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
    // console.log("PIN PENDING", pending);
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
    let { width, height, scale } = this.props;
    setupCanvasDependentUDFs(ctx, scale, width, height);
    db.create_function("setMapPending", this.setMapPending);
    db.create_function("setMapBounds", this.setMapBounds);
    window.addEventListener("keydown", this.handleKeyDown);
  }

  handleStreaming() {
    this.setState(prevState => ({
      streaming: !prevState.streaming
    }));
    toggleStreaming();
  }

  interact(itxType: string, brush: d3.BrushBehavior<{}>) {
    return() => {
      let navSelection = this.props.logical ? this.state.intendedNavSelection : this.state.navSelection;
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
      d3.select(".brush").call(brush.move, null);
    };
  }

  onFileChange(e: any) {
    loadDb(e.target.files[0]);
  }

  replay() {
    if (this.state.replayIntervalId) {
      // then pause
      window.clearInterval(this.state.replayIntervalId);
      this.setState({replayIntervalId: null});
    } else {
      let replayIntervalId = replayBackwardsSession(1000, this.setReplayIntervalNull);
      this.setState({replayIntervalId});
    }
  }

  setReplayIntervalNull() {
    this.setState({replayIntervalId: null});
  }

  render() {
    let { width, height, scale } = this.props;
    let { controlsDisabled, pending } = this.state;
    let brushDiv: JSX.Element;
    let brush: d3.BrushBehavior<{}>;
    if (this.state.navSelection) {
      let t = mapBoundsToTransform(this.state.navSelection, scale, width, height);
      // console.log("transformation for render", t);
      // makes more sense to use svg since the brush wouldn't cause a canvas redraw
      // this is really better than the SQL all in approach.
      let p = getTranslatedMapping(t, scale, width, height);
      brush = d3.brush()
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
                        // and then remove
                        d3.select(".brush").call(brush.move, null);
                      }
                    });
      brushDiv = <g ref={ g => d3.select(g).call(brush) } className="brush"></g>;
    }
    let controls = ["in", "out", "left", "right", "up", "down"].map((c) => <button className="btn" style={{color: "purple"}}
        onClick={this.interact(c, brush)}
        disabled={controlsDisabled[c]}
      >{c}</button>);
    let pendingClassName = pending ? "indicatorLine" : "";
    return(<div style={{overflow: "auto"}}>
      {controls}
      <div style={{position: "relative", height, width}}>
      <div className={pendingClassName} style={{height: 5}}></div>
        <canvas style={{position: "absolute"}} ref="canvas" width={width} height={height}
        />
        <svg style={{position: "absolute"}} width={width} height={height}>
          {brushDiv}
          <Chart
            width={width * 0.2}
            height={width * 0.2}
            series={["Q1", "Q2", "Q3", "Q4"]}
          />
        </svg>
      </div>
      <button className="btn" onClick={showPastMapBrushes}>Past Brushes</button>
      <button className="btn" onClick={this.replay}>Animate Past</button>
      <button className="btn"onClick={this.handleStreaming}>{this.state.streaming ? "Pause" : "Start"} Streaming</button>
      <br/>
      <button className="btn" onClick={() => downloadQueryResultAsCSV(`SELECT * FROM userData`)}>Export Brush Data</button>
      <button className="btn" onClick={() => {
        db.exec(removeCacheSQL);
      }}>Clear Cache</button>
      <button className="btn" onClick={downloadDB}>Download Session</button>
      <label>Upload Session<input type="file" onChange={this.onFileChange} /></label>
    </div>);
  }
}