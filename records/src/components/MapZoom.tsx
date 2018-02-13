import * as React from "react";
import * as d3 from "d3";
import * as d3ScaleChromatic from "d3-scale-chromatic";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson";
import { ZoomBehavior } from "d3";

import { getMapEventData, MapSelection, MapDatum, getRandomInt} from "../lib/data";
import { InteractionTypes } from "../lib/history";

interface Coords {
  lat: number;
  long: number;
}

interface MapZoomProps {
  mapData: MapDatum[];
  pop: {[index: string]: number};
  newMapInteraction: (type: InteractionTypes, params: any) => {
    itxid: number; requested: boolean}; // get the itxId
  width?: number;
  height?: number;
  maxLatency?: number;
  minLatency?: number;
}

interface MapZoomState {
  currentVersion: number;
  worldData: any[];
  center: Coords;
  zoomScale: number;
  zoom: any;
  zoomTransform: any;
  text?: string;
}

const SCALE = 100;
const WIDTH = 800;
const HEIGHT = 450;

// for static: https://medium.com/@zimrick/how-to-create-pure-react-svg-maps-with-topojson-and-d3-geo-e4a6b6848a98
// for dynamic: combined https://bl.ocks.org/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2 (for d3 V4) and https://swizec.com/blog/two-ways-build-zoomable-dataviz-component-d3-zoom-react/swizec/7753 (for react).
export default class MapZoom extends React.Component<MapZoomProps, MapZoomState> {
  svg: SVGElement;
  button: HTMLButtonElement;
  static defaulProps = {
    width: 800,
    height: 450,
    maxLatency: 4000,
    minLatency: 1000,
  };

  constructor(props: MapZoomProps) {
    super(props);
    // interaction lifecyle
    this.zoomed = this.zoomed.bind(this);
    this.download = this.download.bind(this);
    this.setNames = this.setNames.bind(this);
    let zoom = d3.zoom()
              .scaleExtent([1, 8])
              .on("zoom", this.zoomed);
    this.state = {
      zoomScale: 1,
      currentVersion: -1, // not yet loaded
      center: {lat: 0, long: 0},
      worldData: [],
      zoom,
      zoomTransform: null
    };
  }


  setNames(error: any, data: any[]) {
    // let dict: {[index: string]: string} = {};
    let text = this.state.text;
    data.map((d) => {
      text = text.replace(`"id":"${d.id}"`, `"id":"${d.name}"`);
    });
    this.setState({
      text,
    });
    // trigger download
    // this.button.click();
  }

  componentDidUpdate() {
    d3.select(this.svg)
      .call(this.state.zoom);
  }

  componentDidMount() {
    // "https://unpkg.com/world-atlas@1/world/110m.json") // /data/world_countries.json") http://enjalot.github.io/wwsd/data/world/world-110m.geojson")//
    fetch("/data/world.json")
    .then(response => {
      if (response.status !== 200) {
        console.log(`There was a problem: ${response.status}`);
        return;
      }
      response.json().then(worldData => {
        this.setState({
          text: JSON.stringify(worldData),
          worldData: feature(worldData, worldData.objects.countries).features,
        });
        d3.tsv("/data/world-country-names.tsv", this.setNames);
      });
    });

    d3.select(this.svg)
      .call(this.state.zoom);

    this.props.newMapInteraction(InteractionTypes.ZOOMMAP, {
      latMin: -90,
      latMax: 90,
      longMax: 180,
      longMin: 180,
    });
  }

  zoomed(event: any) {
    // this is for async
    console.log("Transform", d3.event.transform);
    // let p =  geoMercator()
    //           .scale( SCALE * d3.event.transform.k)
    //           .translate([WIDTH / 2 + d3.event.transform.x, HEIGHT / 2 - d3.event.transform.y]);
    let p = this.projection();
    let nw = p.invert([0, 0]);
    let se = p.invert([ WIDTH, HEIGHT]);
    let selection: MapSelection = {
      latMin: se[1],
      longMin: nw[0],
      latMax: nw[1],
      longMax: se[0]
    };
    console.log("selection", selection);
    this.props.newMapInteraction(InteractionTypes.ZOOMMAP, selection);
    // this is for immediate feedback
    this.setState({
      zoomScale: d3.event.scale,
      zoomTransform: d3.event.transform
    });
  }

  // projection() {
  //   return geoMercator()
  //     .scale(SCALE)
  //     .translate([ WIDTH / 2, HEIGHT / 2 ]);
  // }

  projection() {
    let k: number;
    let tx: number;
    let ty: number;
    if (d3.event && d3.event.transform) {
      k = d3.event.transform.k;
      tx = d3.event.transform.x;
      ty = d3.event.transform.y;
      // console.log("change", k, tx, ty, d3.event.transform);
    } else {
      k = 1;
      tx = 0;
      ty = 0;
    }
    return geoMercator()
      .scale( SCALE * k)
      .translate([WIDTH / 2 + tx, HEIGHT / 2 + ty]);
  }

  download() {
    let link = document.createElement("a");
    link.setAttribute("download", "world.json");
    link.href =  window.URL.createObjectURL(new Blob([this.state.text], {type: "text/plain"}));
    document.body.appendChild(link);
    // wait for the link to be added to the document
    window.requestAnimationFrame(function () {
      let event = new MouseEvent("click");
      link.dispatchEvent(event);
      document.body.removeChild(link);
    });
  }

  render() {
    let { width, height, mapData } = this.props;
    let { center, worldData, zoomTransform  } = this.state;
    const MAXPOP = 1330141295;
    let p = this.projection();
    let pathSVG = worldData.map((d, i) => {
      let colorVal = this.props.pop[d.id] ? Math.pow(this.props.pop[d.id] / MAXPOP, 0.4) * 0.6 + 0.1 : 0.2;
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
    if (mapData) {
      console.log("dots length", mapData.length);
      dotsSVG = mapData.map((d: any, i) => {
        let projection = d3.geoMercator();
        return <circle cx={this.projection()([d.long, d.lat])[0]} cy={p([d.long, d.lat])[1]} r={0.5} fillOpacity={0.1} fill="red"></circle>;
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
      </g>
    </svg>
    {spinner}
    <button id="downloadBtn" onClick={this.download} ref = {b => this.button = b} style={{display: "none"}}></button>
    </div>);
  }
}