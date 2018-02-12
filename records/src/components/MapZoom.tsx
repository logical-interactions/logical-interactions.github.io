import * as React from "react";
import * as d3 from "d3";
import * as d3ScaleChromatic from "d3-scale-chromatic";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson";
import { ZoomBehavior } from "d3";

import { getMapEventData, MapSelection, MapDatum, getRandomInt} from "../lib/data";

interface Coords {
  lat: number;
  long: number;
}

enum InteractionTypes {
  ZOOM,
  BURSH
}

enum ChartTypes {
  MAP,
  BAR
}

interface InteractionEntry {

}

interface RequestEntry {

}

interface ResponseEntry {
  itxid: number;
  data: any[]; // we can parametrize this later
}

interface MapZoomProps {
  mapData: MapDatum[];
  pop: {[index: string]: number};
  width?: number;
  height?: number;
  maxLatency?: number;
  minLatency?: number;
}

interface MapZoomState {
  itxid: number;
  // currentState: ;
  worldData: any[];
  center: Coords;
  zoomLevel: number;
  zoom: any;
  zoomTransform: any;
  selection: MapSelection;
  // this demonstrates that it can be done with simple logs
  currentMapVersion: number;
  currentChartVersion: number;
  interactionHistory: InteractionEntry[];
  requestHistory: RequestEntry[];
  responseHistory: ResponseEntry[];
  text?: string;
}

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
    let scale0 = (props.width - 1) / 2 / Math.PI;
    this.zoomed = this.zoomed.bind(this);
    this.processResponse = this.processResponse.bind(this);
    this.download = this.download.bind(this);
    this.setNames = this.setNames.bind(this);
    let zoom = d3.zoom()
              .scaleExtent([1, 8])
              .on("zoom", this.zoomed);
    this.state = {
      itxid: 0,
      center: {lat: 0, long: 0},
      zoomLevel: 3,
      currentMapVersion: 0,
      currentChartVersion: -1,
      interactionHistory: [],
      requestHistory: [],
      responseHistory: [{
        itxid: 0,
        data: []
      }],
      worldData: [],
      selection: {
        latMin: -90,
        latMax: 90,
        longMax: 180,
        longMin: 180,
      },
      zoom,
      zoomTransform: null
    };
    // todo
    // gotData();
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
    this.button.click();
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
        // console.log("got world level data", this.state.worldData);
      });
    });

    d3.select(this.svg)
      .call(this.state.zoom);
  }

  gotData(scale: number, x: number, y: number) {
    // get the dots
    getMapEventData(this.props.mapData, this.state.itxid, this.state.selection)
      .then(this.processResponse);
  }

  processResponse(response: any) {
    const {selection, data, itxid} = response;
    console.log("response", response);
    this.setState(prevState => {
      prevState.responseHistory.push({
        itxid,
        data
      });
      return {
        responseHistory: prevState.responseHistory
      };
    });
  }

  zoomed(event: any) {
    console.log("zoom", d3.event.transform);
    // add async
    this.setState({
      zoomTransform: d3.event.transform
    });
    // double click
    // capture the current position and zoom
    // if the previous is loading
    // just keep on zooming on the previous center?
    // console.log("doublclicked", event, event.clientX);
    // console.log("relative offset", event.target);
  }

  projection() {
    return geoMercator()
      .scale(100)
      .translate([ 800 / 2, 450 / 2 ]);
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
    let { width, height } = this.props;
    let { center, zoomLevel, worldData, zoomTransform, itxid, selection, responseHistory } = this.state;
    const MAXPOP = 1330141295;
    // let colorScale = (0.8);
    let pathSVG = worldData.map((d, i) => {
      let colorVal = this.props.pop[d.id] ? Math.pow(this.props.pop[d.id] / MAXPOP, 0.4) * 0.9 : 0.2;
      // console.log("this is what d looks like", d.id, this.props.pop[d.id]);
      return <path
        key={ `path-${i}-${d.id}` }
        d={ geoPath().projection(this.projection())(d) }
        className="country"
        fill={ `${d3ScaleChromatic.interpolateBlues(colorVal)}`}
        stroke="#FFFFFF"
        strokeWidth={ 0.5 }
      />;
    });
    // take the most recent history, FIXME later
    let dotsSVG: JSX.Element[];
    if (responseHistory.length > 0) {
      dotsSVG = responseHistory[responseHistory.length - 1].data.map((d: any, i) => {
        let projection = d3.geoMercator();
        // console.log(this.projection()([d.long, d.lat])[0], this.projection());
        // console.log("simple", projection, projection(), d);
        // throw new Error("");
        return <circle cx={this.projection()([d.long, d.lat])[0]} cy={this.projection()([d.long, d.lat])[1]} r={0.5} fillOpacity={0.1} fill="red"></circle>;
      });
    }
    // console.log("path svg", pathSVG);
    return(<div>
      <svg width={800} height={450} ref={ svg => this.svg = svg}>
      <g transform={zoomTransform}>
      { pathSVG }
      { dotsSVG }
      </g>
    </svg>
    <button id="downloadBtn" onClick={this.download} ref = {b => this.button = b} style={{display: "none"}}></button>
    </div>);
  }
}