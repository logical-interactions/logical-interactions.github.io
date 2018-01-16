import * as React from "react";

import Chart from "./Chart";
import Indicator from "./Indicator";

import { ColorScales } from "../lib/chronicles";
import { Datum } from "../lib/data";

interface MultiplesChartProps {
  bufferSize: number;
  datasets: { [index: string]: Datum[] };
  multipleHeight?: number;
  multipleWidth?: number;
  multipleMarginTop?: number;
  multipleMarginLeft?: number;
  multipleMarginBottom?: number;
  multipleMarginRight?: number;
  selected: string[];
  setDomain?: boolean;
  ordered?: boolean;
  evictedIdx: number;
  colorScale: (i: number) => string;
  label?: boolean;
  reverse?: boolean;
}

/**
 * Represents a small multiples chart visualization. The charts render the
 * selected data from props such that each chart renders only one of the
 * datasets. A progress indicator is rendered if the data is being loaded.
 */
export default class MultiplesChart extends React.Component<MultiplesChartProps, undefined> {
  static defaultProps = {
    multipleHeight: 130,
    multipleWidth: 175,
    multipleMarginTop: 10,
    multipleMarginLeft: 25,
    multipleMarginBottom: 20,
    multipleMarginRight: 15,
    setDomains: false,
    reverse: false,
    label: false,
  };

  render() {
    const { bufferSize, datasets, multipleHeight, multipleWidth,
            multipleMarginTop, multipleMarginLeft, multipleMarginBottom, multipleMarginRight,
            selected, setDomain, ordered, evictedIdx, colorScale, reverse } = this.props;

    // generate charts or indicator if chart is loading
    let charts = [];
    for (let i = 0; i < selected.length; i++) {
      const s = selected[selected.length - 1 - i];
      const loading = (datasets[s] === undefined);
      let start: number;
      if (ordered) {
        start = selected.length - 1;
      } else {
        // render to the position that was evicted
        // which is based on the total number of iterations
        start = evictedIdx;
      }

      const j = reverse ? selected.length - 1 - i : i;
      const idx = (start - j + bufferSize) % bufferSize;
      if (loading) {
        charts[idx] = (
          <div key={"ind_" + i} className="indicator-wrapper inline-block">
            <Indicator loading={loading} />
          </div>
        );
      } else {
        const c = () => colorScale(i);
        let xDomain;
        if (setDomain) {
          console.log("the S: ", s);
          xDomain = JSON.parse(s);
        }
        charts[idx] = (
          <Chart
            key={"chart_" + i}
            bufferSize={1}
            datasets={datasets}
            selected={[s]}
            width={multipleWidth}
            height={multipleHeight}
            marginTop={multipleMarginTop}
            marginLeft={multipleMarginLeft}
            marginBottom={multipleMarginBottom}
            marginRight={multipleMarginRight}
            colorOverride={true}
            xDomain={xDomain}
            yDomain={[0, 100] /* hardcoded */}
            showAxesLabels={false}
            colorScale={c}
            showLabel={this.props.label}
          />
        );
      }
    }

    return (
      <div className="multiples-wrapper inline-block">
        {charts}
      </div>
    );
  }
}
