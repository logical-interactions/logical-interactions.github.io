-- remove brush just gets mapped back to all the data being selected
CREATE TABLE xBrushItx (
  itxId INTEGER PRIMARY KEY,
  ts INTEGER NOT NULL,
  low INTEGER,
  high INTEGER,
  chart TEXT NOT NULL,
  -- this is used for set specific selections; e.g., carrier
  selection TEXT,
  -- the following 2 are for two dimensional filters
  -- I think the overloading here is better than overloading else where
  -- we will see.
  low2 INTEGER,
  high2 INTEGER,
  -- when the interaction is on the newest state, it will be the most recent itxId seen previously
  pastItxId INTEGER
);

-- name: filters
CREATE TABLE xFilterRequest (
  -- this will be the id that directly triggered the interaction
  requestId INTEGER PRIMARY KEY,
  -- optional
  itxId INTEGER,
  ts INTEGER NOT NULL,
  -- can be NULL to indicate no filter
  monthLow INTEGER, monthHigh INTEGER,
  yearLow INTEGER, yearHigh INTEGER,
  carrierSet INTEGER,
  arrDelayLow INTEGER, arrDelayHigh INTEGER,
  depDelayLow INTEGER, depDelayHigh INTEGER,
  UNIQUE(monthLow, monthHigh, yearLow, yearHigh, carrierSet, arrDelayLow, arrDelayHigh, depDelayLow, depDelayHigh)
);

-- caching at the interaction level, for undo-redo
-- but not at the data level.

CREATE TABLE chartData (
  requestId INTEGER NOT NULL,
  bin INTEGER NOT NULL,
  count INTEGER NOT NULL,
  chart TEXT NOT NULL
  -- the uniqueness is not the case for the scatter plot...
  -- UNIQUE(requestId, chart, bin)
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

create table workerTasks (
  commands text
);

create table bufferSize (
  ts INTEGER NOT NULL,
  size integer
);

-- ts is for default
insert into bufferSize (ts, size) values (0, 4);