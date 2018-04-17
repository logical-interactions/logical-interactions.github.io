-- remove brush just gets mapped back to all the data being selected
CREATE TABLE xBrushItx (
  itxId INTEGER PRIMARY KEY,
  ts INTEGER NOT NULL,
  low INTEGER,
  high INTEGER,
  chart TEXT NOT NULL
);

-- name: filters
CREATE TABLE xFilterRequest (
  -- this will be the id that directly triggered the interaction
  requestId INTEGER PRIMARY KEY,
  -- optional
  itxId INTEGER,
  ts INTEGER NOT NULL,
  -- can be NULL to indicate no filter
  hourLow INTEGER, hourHigh INTEGER,
  delayLow INTEGER, delayHigh INTEGER,
  distanceLow INTEGER, distanceHigh INTEGER,
  UNIQUE(hourLow, hourHigh, delayLow, delayHigh, distanceLow, distanceHigh)
);

CREATE TABLE xFilterResponse (
  requestId INTEGER NOT NULL,
  ts INTEGER NOT NULL,
  -- can be a previous requestId, or the currentone
  dataId INTEGER NOT NULL,
  -- optional
  chart TEXT,
  UNIQUE(requestId, chart)
);

-- caching at the interaction level, for undo-redo
-- but not at the data level.

CREATE TABLE chartData (
  requestId INTEGER NOT NULL,
  bin INTEGER NOT NULL,
  count INTEGER NOT NULL,
  chart TEXT NOT NULL,
  UNIQUE(requestId, chart, bin)
);

CREATE TABLE chartDataAtomic (
  requestId INTEGER NOT NULL,
  chart INTEGER NOT NULL,
  UNIQUE(requestId, chart)
);

-- this assumes atomic render
CREATE TABLE xFilterRender (
  itxId INTEGER,
  -- requestId INTEGER,
  -- chart INTEGER,
  ts INTEGER NOT NULL
);

-- CREATE TABLE delayChartData (
--   itxId INTEGER NOT NULL UNIQUE,
--   delayBin INTEGER,
--   count INTEGER,
-- );

-- CREATE TABLE distanceChartData (
--   itxId INTEGER NOT NULL UNIQUE,
--   distanceBin INTEGER,
--   count INTEGER,
-- );