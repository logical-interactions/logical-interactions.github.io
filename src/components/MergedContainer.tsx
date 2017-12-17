import * as React from "react";

import Chart from "./Chart";
import WidgetFacet from "./WidgetFacet";
import MultiplesChart from "./MultiplesChart";

import { Events, ColorScales } from "../lib/chronicles";
import { Datum, getData } from "../lib/data";

interface MergedContainerProps {
  avgDelay: number;
  varDelay: number;
  encoding: string;
  bufferSize: number;
  color: string;
  ordered: boolean;
  disabled: boolean;
}

interface MergedContainerState {
  datasets: { [index: string]: Datum[] };
  facets: string[];
  selected: string[];
  eventLog: {
    event: string,
    selection: string,
    itxid: number,
    ts: number
  }[];
  currentItxId: number;
  evictedIdx: number;
  // below are optional for multiples
  multipleHeight?: number;
  multipleWidth?: number;
}

/**
 * Stateful container for all the interaction elements.
 */
export default class MergedContainer extends React.Component<MergedContainerProps, MergedContainerState> {
  _isMounted: boolean;

  constructor(props: MergedContainerProps) {
    super(props);
    this.updateSelection = this.updateSelection.bind(this);
    this.processResponse = this.processResponse.bind(this);
    this.state = {
      datasets: {},
      facets: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      selected: [],
      eventLog: [],
      currentItxId: 0,
      evictedIdx: -1,
    };
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  /**
   * Updates state when a new interaction occurs by maintaining an LRU cache
   * of recently selected items. The most recent item is positioned at the
   * end of the array.
   * @param {string} selection
   */
  updateSelectedState(selection: string) {
    this.setState((prevState, props) => {
      let selected;
      prevState = Object.assign({}, prevState);
      const idx = prevState.selected.indexOf(selection);
      if (idx > -1) {
        // item exists in cache, remove it for re-insertion at the end
        selected = prevState.selected.slice();
        selected.splice(idx, 1);
      } else {
        if (prevState.selected.length < this.props.bufferSize) {
          selected = prevState.selected.slice();
        } else {
          // cache is full, evict least recently used item from cache
          delete prevState.datasets[prevState.selected[0]];
          selected = prevState.selected.slice(1);
        }
        prevState.evictedIdx = (prevState.evictedIdx + 1) % props.bufferSize;
      }
      selected.push(selection);
      prevState.selected = selected;
      return prevState;
    });
  }

  /**
   * Processes the response received by adding the dataset to the cache if
   * it has been selected.
   * @param {number} taskNum
   * @param {string} selection
   * @param {Datum[]} data
   */
  processResponse(response: any) {
    if (this._isMounted) {
      const {taskNum, selection, data, itxid} = response;
      this.setState(prevState => {
        const eventLog = prevState.eventLog.slice();
        const logRecord = {
          event: Events[Events.render],
          taskNum: taskNum,
          selection: selection,
          itxid: itxid,
          ts: Date.now()
        };
        eventLog.push(logRecord);
        if (prevState.selected.indexOf(selection) > -1) {
          const datasets = Object.assign({}, prevState.datasets);
          datasets[selection] = data;
          return { datasets, eventLog };
        }
        logRecord.event = Events[Events.discard];
        return { eventLog };
      });
    }
  }

  /**
   * Handles updates from widget. Updates selected cache state, sends
   * server request for data, and processes the results.
   * We should be using id for any complex data vis but for now do not
   *   use id and hack with taskNum.
   * @param {string} selection
   */
  updateSelection(selection: string) {
    const { currentItxId, datasets, selected } = this.state;
    if (this.props.disabled) {
      // no-op
      return;
    }

    const isSelected = (selected.indexOf(selection) > -1);
    const isRequesting = datasets[selection] == null;
    this.updateSelectedState(selection);
    const itxid = currentItxId + 1;
    this.appendNewInteraction(selection, isSelected, isRequesting);
    if (!isSelected) {
      getData(selection, this.props.avgDelay, this.props.varDelay, itxid)
        .then(this.processResponse);
    }
  }

  /**
   * Generates a unique ixn ID for this widget that's monotonically increasing,
   * and appends a new log record to the event log
   */
  appendNewInteraction(selection: string, isSelected: boolean, isRequesting: boolean) {
    this.setState(prevState => {
      const eventLog = prevState.eventLog.slice();
      const currentItxId = prevState.currentItxId + 1;
      let event;
      if (isSelected) {
        if (isRequesting) {
          event = Events[Events.requesting];
        } else {
          event = Events[Events.cached];
        }
      } else {
        event = Events[Events.interaction];
      }
      eventLog.push({
        event,
        selection: selection,
        ts: Date.now(),
        itxid: currentItxId,
      });
      return { currentItxId, eventLog };
    });
  }

  render() {
    const { bufferSize, ordered, color } = this.props;
    const { multipleHeight, datasets, multipleWidth, selected, evictedIdx } = this.state;
    let colorScale;
    if (ordered) {
      colorScale = ColorScales[color](bufferSize);
    } else {
      colorScale = ColorScales[color](bufferSize, evictedIdx);
    }
    let chart;
    let widget = <WidgetFacet
    // id={widgetId}
    bufferSize={bufferSize}
    facets={this.state.facets}
    datasets={datasets}
    selected={selected}
    updateSelection={this.updateSelection}
    colorScale={colorScale}
  />;
    if (this.props.encoding === "COLOR") {
      chart = <Chart
        bufferSize={this.props.bufferSize}
        datasets={datasets}
        selected={selected}
        xDomain={[2008, 2012] /* hardcoded */}
        yDomain={[0, 100] /* hardcoded */}
        colorScale={colorScale}
      />;

    } else {
      chart = <MultiplesChart
        bufferSize={bufferSize}
        datasets={datasets}
        multipleHeight={multipleHeight}
        multipleWidth={multipleWidth}
        selected={selected}
        setDomain={false}
        ordered={ordered}
        evictedIdx={evictedIdx}
        colorScale={colorScale}
      />;
    }

    return (
      <div>
        {widget}
        {chart}
      </div>
    );
  }
}
