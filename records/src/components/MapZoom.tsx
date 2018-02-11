
import * as React from "react";
import * as d3 from "d3";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson";
import { ZoomBehavior } from "d3";
// import * as topojson from "topojson";

interface Coords {
  lat: number;
  long: number;
}

interface MapZoomProps {
  width?: number;
  height?: number;
}

interface MapZoomState {
  // currentState: ;
  worldData: any[];
  center: Coords;
  zoomLevel: number;
  zoom: any;
  zoomTransform: any;
}

// https://medium.com/@zimrick/how-to-create-pure-react-svg-maps-with-topojson-and-d3-geo-e4a6b6848a98
export default class MapZoom extends React.Component<MapZoomProps, MapZoomState> {
  svg: SVGElement;
  static defaulProps = {
    width: 800,
    height: 450,
  };

  constructor(props: MapZoomProps) {
    super(props);
    let scale0 = (props.width - 1) / 2 / Math.PI;
    this.zoomed = this.zoomed.bind(this);
    let zoom = d3.zoom()
              .scaleExtent([1, 8])
              .on("zoom", this.zoomed);
    this.state = {
      center: {lat: 0, long: 0},
      zoomLevel: 3,
      worldData: [],
      zoom,
      zoomTransform: null
    };
  }

  componentDidUpdate() {
    d3.select(this.svg)
      .call(this.state.zoom);
  }
  componentDidMount() {
    // "https://unpkg.com/world-atlas@1/world/110m.json") // /data/world_countries.json") http://enjalot.github.io/wwsd/data/world/world-110m.geojson")//
    fetch("/data/world-110m.json")
    .then(response => {
      if (response.status !== 200) {
        console.log(`There was a problem: ${response.status}`);
        return;
      }
      response.json().then(worldData => {
        console.log("got world level data", worldData);
        this.setState({
          worldData: feature(worldData, worldData.objects.countries).features,
        });
      });
    });

    d3.select(this.svg)
      .call(this.state.zoom);
  }

  zoomed(event: any) {
    console.log("zoom", d3.event.transform);
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

  render() {
    let { width, height } = this.props;
    let { center, zoomLevel, worldData, zoomTransform } = this.state;
    let pathSVG = worldData.map((d, i) => {
      return <path
        key={ `path-${ i }` }
        d={ geoPath().projection(this.projection())(d) }
        className="country"
        fill={ `rgba(38,50,56, ${1 / this.state.worldData.length * i}`}
        stroke="#FFFFFF"
        strokeWidth={ 0.5 }
      />;
    });
    // console.log("path svg", pathSVG);
    return(<div>
      <svg width={800} height={450} ref={ svg => this.svg = svg}>
      <g transform={zoomTransform}>
      { pathSVG }
      </g>
    </svg></div>);
  }
}