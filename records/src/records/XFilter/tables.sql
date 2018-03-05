-- remove brush just gets mapped back to all the data being selected
CREATE TABLE brushItx (
  itxId INTEGER PRIMARY KEY,
  ts INTEGER NOT NULL,
  low INTEGER NOT NULL,
  high INTEGER NOT NULL,
  chart TEXT NOT NULL
);

CREATE TABLE filterHistory (
  filterId INTEGER PRIMARY KEY,
  -- can be NULL to indicate no filter
  hourLow INTEGER, hourHigh INTEGER,
  delayLow INTEGER, delayHigh INTEGER,
  distanceLow INTEGER, distanceHigh INTEGER,
  UNIQUE(hourLow, hourHigh, delayLow, delayHigh, distanceLow, distanceHigh)
);

CREATE TABLE brushRequest (
  itxId INTEGER PRIMARY KEY,
  filterId INTEGER,
  ts INTEGER
);

-- caching at the interaction level, for undo-redo
-- but not at the data level.

CREATE TABLE hourChartData (
  filterId INTEGER PRIMARY KEY,
  hourBin INTEGER,
  count INTEGER,
);

CREATE TABLE delayChartData (
  filterId INTEGER PRIMARY KEY,
  delayBin INTEGER,
  count INTEGER,
);

CREATE TABLE distanceChartData (
  filterId INTEGER PRIMARY KEY,
  distanceBin INTEGER,
  count INTEGER,
);