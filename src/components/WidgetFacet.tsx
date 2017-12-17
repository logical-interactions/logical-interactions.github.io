import * as React from "react";

import Indicator from "./Indicator";

import { ColorScales } from "../lib/chronicles";
import { Datum } from "../lib/data";

interface WidgetProps {
  bufferSize: number;
  datasets: { [index: string]: Datum[] };
  facets: string[];
  selected: string[];
  showIndicator?: boolean;
  updateSelection(selection: string): void;
  colorScale: (i: number) => string;
}

/**
 * Represents an interaction widget. The widget calls the updateSelection
 * property method when hovering over a list item.
 */
export default class WidgetFacet extends React.Component<WidgetProps, undefined> {
  static defaultProps = {
    showIndicator: false
  };

  render() {
    const { bufferSize, datasets, facets, selected, showIndicator,
            updateSelection, colorScale } = this.props;
    const loading = showIndicator &&
                    selected.some(s => datasets[s] === undefined);

    // map facet strings to DOM list items
    const listItems = facets.map(f => {
      const mouseover = () => updateSelection(f);

      // set background color if item is in selected cache
      const style: React.CSSProperties = {};
      const idx = selected.indexOf(f);
      if (idx > -1) {
        style.background = colorScale(selected.length - 1 - idx);
      }
      // if ((idx > -1) && (idx === selected.length - 1)) {
      //   style.background = colorScale(selected.length - 1 - idx);
      // }

      return (
        <li key={f} className="button-widgets" style={style}
          onMouseOver={mouseover}>{f}</li>
      );
    });

    return (
      <div className="inline-block">
        <div className="widget-wrapper inline-block">{listItems}</div>
        <Indicator loading={loading} />
      </div>
    );
  }
}
