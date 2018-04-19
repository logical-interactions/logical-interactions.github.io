-- low and high of -1 are indication of clearing brush.

create table itx (
  sn INTEGER PRIMARY KEY,
  ts INTEGER NOT NULL,
  low INTEGER,
  high INTEGER,
  -- window or brush
  itxType TEXT,
);

CREATE TABLE chartAData (
  requestId INTEGER NOT NULL,
  bin INTEGER NOT NULL,
  count INTEGER NOT NULL,
  chart TEXT NOT NULL,
  UNIQUE(requestId, chart, bin)
);

CREATE TABLE chartBData (
  requestId INTEGER NOT NULL,
  bin INTEGER NOT NULL,
  count INTEGER NOT NULL,
  chart TEXT NOT NULL,
  UNIQUE(requestId, chart, bin)
);

CREATE TABLE brushItxRender (
  itxId INTEGER,
  ts INTEGER NOT NULL
);
