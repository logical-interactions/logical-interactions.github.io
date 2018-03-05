import * as React from "react";
// we can connect this with MapZoom
// so that it's more like a dashboard
// we can show its very easy to keep separateion of concerns

import XFilterChart from "./XFilterChart";
import { db } from "../records/setup";
import { setupXFilterDB } from "../records/XFilter/setup";


export const XFilterContainer = () => {
  // fetch the data from the views
  return (<>
  <XFilterChart
  />
  </>);
};