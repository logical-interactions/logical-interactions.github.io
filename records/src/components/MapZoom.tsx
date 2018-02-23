import * as React from "react";
import * as d3 from "d3";
import * as d3ScaleChromatic from "d3-scale-chromatic";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson";

import { checkBounds, interactionHelper, getTranslatedMapping } from "../lib/helper";
import { db, insertNavItxStmt, insertBrushItxStmt, undoQuery, setupCanvas } from "../records/setup";
import { getMapEventData, MapSelection, MapDatum, getRandomInt, Rect, Coords, mapBoundsToTransform, approxEqual, SCALE, WIDTH, HEIGHT } from "../lib/data";
import { InteractionTypes, PinState, BrushState, Transform } from "../lib/history";

interface MapZoomProps {
  population: {[index: string]: number};
  width?: number;
  height?: number;
  maxLatency?: number;
  minLatency?: number;
  debuging?: boolean;
}

interface MapZoomState {
  // brushItxId: number;
  // navItxId: number;
  navSelection: MapSelection;
  shiftDown: boolean;
  // pins: PinState;
  controlsDisabled: {[index: string]: boolean};
  worldData: any[];
}

const MAXPOP = 1330141295;

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
    // this.setMapState = this.setMapState.bind(this);
    this.setMapBounds = this.setMapBounds.bind(this);
    this.interact = this.interact.bind(this);
    // db.create_function("setMapState", this.setMapState);
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
      worldData: [],
    };
  }

  // brushItxId: number;
  // navItxId: number;
  // setBrushItxId(brushItxId: number) {

  // }
  // when the results show up
  // render the countries and the barcharts
  // no need to check if the state of the brush is still the same if we bind on data space
  // setMapState(itxId: number, data: MapDatum[]) {
  //   console.log("setting map state", itxId, data);
  //   this.setState({
  //     pins: {itxId, data}
  //   });
  // }

  setMapBounds(latMin: number, latMax: number, longMin: number, longMax: number) {
    let navSelection = {
      nw: [longMin, latMax] as Coords,
      se: [longMax, latMin] as Coords
    };
    this.setState({
      navSelection
    });
  }

  // to avoid redundant react updates, should just have one component responsible for one thing.
  // before components were overloaded with layout etc, try to separate it.
  componentDidUpdate() {
    const canvas = this.refs.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if ((this.state.navSelection) && (this.state.worldData)) {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      // clear the map
      // TODO: use fancy buffer to make things even faster!
      // var buffer = document.createElement('canvas');
      // buffer.width = canvas.width;
      // buffer.height = canvas.height;
      // // save
      // buffer.getContext('2d').drawImage(canvas, 0, 0);
      // // restore
      // canvas.getContext('2d').drawImage(buffer, 0, 0);
      let t = mapBoundsToTransform(this.state.navSelection, SCALE, WIDTH, HEIGHT);
      console.log("transformation for render", t);
      let p = getTranslatedMapping(t);
      let path = geoPath()
                  .projection(p)
                  .context(ctx);
      this.state.worldData.forEach((d, i) => {
        let colorVal = this.props.population[d.id] ? Math.pow(this.props.population[d.id] / MAXPOP, 0.4) * 0.6 + 0.1 : 0.2;
        ctx.fillStyle = d3ScaleChromatic.interpolateBlues(colorVal);
        ctx.beginPath();
        path(d);
        ctx.fill();
      });
      // console.log("canvas should have been udapted");
    }
  }


  handleKeyDown(event: any) {
    // Cmd+Z
    if ((event.metaKey) && (event.keyCode === 90)) {
      db.run(undoQuery);
    }
  }

  componentDidMount() {
    const canvas = this.refs.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    setupCanvas(ctx);
    // now pass this canvas reference to draw dots on!
    // db.create_function("setMapState", this.setMapState);
    window.addEventListener("keydown", this.handleKeyDown);
    // window.addEventListener("keyup", this.handleKeyUp);
    // creates a handle to update this component
    fetch("/data/world.json")
    .then(response => {
      if (response.status !== 200) {
        console.log(`There was a problem: ${response.status}`);
        return;
      }
      response.json().then(worldDataRaw => {
        let worldData = feature(worldDataRaw, worldDataRaw.objects.countries).features;
        this.setState({
          worldData,
        });
      });
    });
  }

  // so our undo redo logic will by similar to others (checked with Sublime), where a branch is lost from the linear path forward (much like how copy paste's clip board copy is gone after a second copy)

  interact(itxType: string) {
    return() => {
      let {nw, se} = interactionHelper(this.state.navSelection, itxType);
      let controlsDisabledOld = Object.assign({}, this.state.controlsDisabled);
      let controlsDisabled = checkBounds(controlsDisabledOld, nw as Coords, se as Coords);
      if (JSON.stringify(controlsDisabled) !== JSON.stringify(this.state.controlsDisabled)) {
        this.setState({controlsDisabled});
      }
      insertNavItxStmt.run([+new Date(), ...nw, ...se]);
    };
  }

  render() {
    let { width, height } = this.props;
    let { controlsDisabled } = this.state;
    let brushDiv: JSX.Element;
    if (this.state.navSelection) {
      let t = mapBoundsToTransform(this.state.navSelection, SCALE, WIDTH, HEIGHT);
      // console.log("transformation for render", t);
      // makes more sense to use svg since the brush wouldn't cause a canvas redraw
      // this is really better than the SQL all in approach.
      let p = getTranslatedMapping(t);
      let brush = d3.brush()
                    .extent([[0, 0], [innerWidth, innerHeight]])
                    .on("end", function() {
                      const s = d3.brushSelection(this) as [[number, number], [number, number]];
                      if (s !== null) {
                        let nw = p.invert(s[0]);
                        let se = p.invert(s[1]);
                        insertBrushItxStmt.run([+new Date(), ...nw, ...se]);
                      }
                    });
      brushDiv = <g ref={ g => d3.select(g).call(brush) }></g>;
    }
    let controls = ["in", "out", "left", "right", "up", "down"].map((c) => <button onClick={this.interact(c)} disabled={controlsDisabled[c]}>{c}</button>);
    return(<>
      {controls}
      <div style={{position: "relative", height: HEIGHT, width: WIDTH}}>
        <canvas style={{position: "absolute"}} ref="canvas" width={WIDTH} height={HEIGHT} />
        <svg style={{position: "absolute"}} width={WIDTH} height={HEIGHT}>
          {brushDiv}
        </svg>
      </div>
    </>);
  }
}