import * as React from "react";
import * as d3 from "d3";
import * as d3ScaleChromatic from "d3-scale-chromatic";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson";

import { db } from "../records/setup";
import { getMapEventData, MapSelection, MapDatum, getRandomInt, Rect, Coords, mapBoundsToTransform, approxEqual } from "../lib/data";
import { InteractionTypes, MapState, PinState, BrushState, Transform } from "../lib/history";

import { insertInteractionStmt } from "../records/setup";

interface MapZoomProps {
  population: {[index: string]: number};
  width?: number;
  height?: number;
  maxLatency?: number;
  minLatency?: number;
  debuging?: boolean;
}

interface MapZoomState {
  mapBounds: MapState;
  brush: BrushState;
  shiftDown: boolean;
  pins: PinState;
  worldData: any[];
}

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
    this.state = {
      shiftDown: false,
      pins: null,
      brush: null,
      mapBounds: null,
      worldData: [],
    };
  }

  handleKeyDown(event: any) {
    if (event.shiftKey) {
      console.log("shift is pressed");
      this.setState({shiftDown: true});
    }
  }

  handleKeyUp(event: any) {
    if (event.shiftKey) {
      this.setState({shiftDown: false});
    }
  }

  setMapState() {
    let pinState: PinState
    this.setState({
      pins,
    });
  }
  componentDidMount() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    // creates a handle to update this component
    db.create_function("setMapState", this.setMapState);
    // "https://unpkg.com/world-atlas@1/world/110m.json") // /data/world_countries.json") http://enjalot.github.io/wwsd/data/world/world-110m.geojson")//
    fetch("/data/world.json")
    .then(response => {
      if (response.status !== 200) {
        console.log(`There was a problem: ${response.status}`);
        return;
      }
      response.json().then(worldData => {
        this.setState({
          worldData: feature(worldData, worldData.objects.countries).features,
        });
      });
    });
  }

  zoomOut(event: any) {
    // db.prepare();
  }

  zoomIn(event: any) {

  }

  getTranslatedMapping(t: Transform) {
    return geoMercator()
            .scale(SCALE * t.k)
            .translate([WIDTH - t.x, HEIGHT - t.y]);
  }
  render() {
    // setup
    // var buffer = document.createElement('canvas');
    // buffer.width = canvas.width;
    // buffer.height = canvas.height;


    // // save
    // buffer.getContext('2d').drawImage(canvas, 0, 0);

    // // restore
    // canvas.getContext('2d').drawImage(buffer, 0, 0);
    let { width, height, currentMapState, currentPinState, currentBrushState } = this.props;
    let { worldData, shiftDown } = this.state;
    let t = mapBoundsToTransform(currentMapState.selection, SCALE, WIDTH, HEIGHT);
    console.log("transformation for render", t);
    let p = this.getTranslatedMapping(t);
    let brushDiv: JSX.Element;
    if (shiftDown) {
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
    const MAXPOP = 1330141295;
    let pathSVG = worldData.map((d, i) => {
      let colorVal = this.props.population[d.id] ? Math.pow(this.props.population[d.id] / MAXPOP, 0.4) * 0.6 + 0.1 : 0.2;
      return <path
        key={ `path-${i}-${d.id}` }
        d={ geoPath().projection(p)(d) }
        className="country"
        fill={ `${d3ScaleChromatic.interpolateBlues(colorVal)}`}
        stroke="#FFFFFF"
        strokeWidth={ 0.5 }
      />;
    });
    let dotsSVG: JSX.Element[];
    let spinner: JSX.Element;
    if (currentPinState) {
      dotsSVG = currentPinState.data.map((d: any, i) => {
        return <circle cx={p([d.long, d.lat])[0]} cy={p([d.long, d.lat])[1]} r={0.5} fillOpacity={0.1} fill="red"></circle>;
      });
    } else {
      spinner = <div className="indicator inline-block"></div>;
    }
    return(<div>
      <svg width={800} height={450} ref={ svg => this.svg = svg}>
      {/*  transform={zoomTransform} */}
      <g>
      { pathSVG }
      { dotsSVG }
      { brushDiv }
      </g>
    </svg>
    {spinner}
    <button id="downloadBtn" onClick={this.zoomIn} ref = {b => this.button = b}>IN</button>
    <button id="downloadBtn" onClick={this.zoomOut} ref = {b => this.button = b}>OUT</button>
    </div>);
  }
}