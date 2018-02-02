
import * as React from "react";
import * as d3 from "d3";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson";
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
  worldData: any[];
  center: Coords;
  zoom: number;
}

// https://medium.com/@zimrick/how-to-create-pure-react-svg-maps-with-topojson-and-d3-geo-e4a6b6848a98
export default class MapZoom extends React.Component<MapZoomProps, MapZoomState> {
  static defaulProps = {
    width: 800,
    height: 450,
  };

  constructor(props: undefined) {
    super(props);
    this.state = {
      center: {lat: 0, long: 0},
      zoom: 3,
      worldData: [],
    };
  }
  componentDidMount() {
    fetch("/data/world_countries.json")
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
  projection() {
    return geoMercator()
      .scale(100)
      .translate([ this.props.width / 2, this.props.height / 2 ]);
  }

  render() {
    let { center, zoom } = this.state;
    let projection = d3.geoMercator();
    // create path variable
    let path = d3.geoPath()
        .projection(projection);
    return(<svg>
      {
        this.state.worldData.map((d, i) => (
          <path
            key={ `path-${ i }` }
            d={ geoPath().projection(this.projection())(d) }
            className="country"
            fill={ `rgba(38,50,56,${1 / this.state.worldData.length * i})` }
            stroke="#FFFFFF"
            strokeWidth={ 0.5 }
          />
        ))
      }
    </svg>);
  }
}