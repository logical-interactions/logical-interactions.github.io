import * as React from "react";

interface IndicatorProps {
  loading: boolean;
}

/**
 * Represents a progress indicator when the UI is performing some
 * asynchronous processing.
 */
export default class Indicator extends React.Component<IndicatorProps, undefined> {
  render() {
    if (!this.props.loading) {
      return null;
    }
    return <div className="indicator inline-block"></div>;
  }
}
