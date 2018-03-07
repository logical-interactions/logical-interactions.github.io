-- remove brush just gets mapped back to all the data being selected
CREATE TABLE brushItx (
  itxId INTEGER PRIMARY KEY,
  ts INTEGER NOT NULL,
  low INTEGER NOT NULL,
  high INTEGER NOT NULL,
  chart TEXT NOT NULL
);

-- name: filters
CREATE TABLE xFilterRequest (
  -- this will be the id that fdirectly triggered the interaction
  requestId INTEGER PRIMARY KEY,
  -- optional
  itxId INTEGER UNIQUE,
  ts INTEGER NOT NULL,
  -- can be NULL to indicate no filter
  hourLow INTEGER, hourHigh INTEGER,
  delayLow INTEGER, delayHigh INTEGER,
  distanceLow INTEGER, distanceHigh INTEGER,
  UNIQUE(hourLow, hourHigh, delayLow, delayHigh, distanceLow, distanceHigh)
);

CREATE TABLE xFilterResponse (
  requestId INTEGER NOT NULL UNIQUE,
  ts INTEGER NOT NULL,
  -- can be a previous requestId, or the currentone
  dataId INTEGER NOT NULL
);

-- caching at the interaction level, for undo-redo
-- but not at the data level.

CREATE TABLE chartData (
  requestId INTEGER NOT NULL,
  bin INTEGER NOT NULL,
  count INTEGER NOT NULL,
  chart INTEGER NOT NULL,
  UNIQUE(requestId, chart, bin)
);

CREATE TABLE chartDataAtomic (
  requestId INTEGER NOT NULL,
  chart INTEGER NOT NULL,
  UNIQUE(requestId, chart)
)

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