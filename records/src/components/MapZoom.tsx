import * as React from "react";
import * as d3 from "d3";
import * as d3ScaleChromatic from "d3-scale-chromatic";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson";

import { checkBounds, interactionHelper } from "../lib/helper";
import { db, insertInteractionStmt } from "../records/setup";
import { getMapEventData, MapSelection, MapDatum, getRandomInt, Rect, Coords, mapBoundsToTransform, approxEqual } from "../lib/data";
import { InteractionTypes, MapState, PinState, BrushState, Transform } from "../lib/history";

interface MapZoomProps {
  population: {[index: string]: number};
  width?: number;
  height?: number;
  maxLatency?: number;
  minLatency?: number;
  debuging?: boolean;
}

interface MapZoomState {
  brush: BrushState;
  mapBounds: MapState;
  shiftDown: boolean;
  pins: PinState;
  controlsDisabled: {[index: string]: boolean};
  worldData: any[];
}

const MAXPOP = 1330141295;
const SCALE = 1 << 6;
const WIDTH = 800;
const HEIGHT = 450;

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
    this.setMapState = this.setMapState.bind(this);
    this.setMapBounds = this.setMapBounds.bind(this);
    this.interact = this.interact.bind(this);
    db.create_function("setMapState", this.setMapState);
    db.create_function("setMapBounds", this.setMapBounds);
    this.state = {
      shiftDown: false,
      pins: null,
      brush: null,
      mapBounds: null,
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

  setMapState(itxId: number, data: MapDatum[]) {
    this.setState({
      pins: {itxId, data}
    });
  }

  setMapBounds(itxId: number, latMin: number, latMax: number, longMin: number, longMax: number) {
    let selection = {
      nw: [longMin, latMax] as Coords,
      se: [longMax, latMin] as Coords
    };
    this.setState({
      mapBounds: {
        itxId, selection
      }
    });
  }

  // to avoid redundant react updates, should just have one component responsible for one thing.
  // before components were overloaded with layout etc, try to separate it.
  componentDidUpdate() {
    const canvas = this.refs.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if ((this.state.mapBounds) && (this.state.worldData)) {
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
      let t = mapBoundsToTransform(this.state.mapBounds.selection, SCALE, WIDTH, HEIGHT);
      console.log("transformation for render", t);
      let p = this.getTranslatedMapping(t);
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

  componentDidMount() {
    // window.addEventListener("keydown", this.handleKeyDown);
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

  interact(itxType: string) {
    return() => {
      let {nw, se} = interactionHelper(this.state.mapBounds.selection, itxType);
      let controlsDisabledOld = Object.assign({}, this.state.controlsDisabled);
      let controlsDisabled = checkBounds(controlsDisabledOld, nw as Coords, se as Coords);
      if (JSON.stringify(controlsDisabled) !== JSON.stringify(this.state.controlsDisabled)) {
        this.setState({controlsDisabled});
      }
      insertInteractionStmt.run([+new Date(), ...nw, ...se]);
    };
  }

  getTranslatedMapping(t: Transform) {
    return geoMercator()
            .scale(SCALE * t.k)
            .translate([WIDTH - t.x, HEIGHT - t.y]);
  }

  render() {
    let { width, height } = this.props;
    let { worldData, pins, brush, controlsDisabled } = this.state;
    let brushDiv: JSX.Element;
    if (this.state.mapBounds) {
      let t = mapBoundsToTransform(this.state.mapBounds.selection, SCALE, WIDTH, HEIGHT);
      // console.log("transformation for render", t);
      let p = this.getTranslatedMapping(t);
      let brush = d3.brush()
                    .extent([[0, 0], [innerWidth, innerHeight]])
                    .on("end", function() {
                      const s = d3.brushSelection(this) as [[number, number], [number, number]];
                      if (s !== null) {
                        let nw = p.invert(s[0]);
                        let se = p.invert(s[1]);
                        insertInteractionStmt.run([+new Date(), ...nw, ...se]);
                      }
                    });
      brushDiv = <g ref={ g => d3.select(g).call(brush) }></g>;
    }
    let controls = ["in", "out", "left", "right", "up", "down"].map((c) => <button onClick={this.interact(c)} disabled={controlsDisabled[c]}>{c}</button>);
    return(<div>
    <canvas ref="canvas" width={WIDTH} height={HEIGHT} />
    {controls}
    </div>);
  }
}