CREATE TABLE mapItx (
  itxId INTEGER PRIMARY KEY,
  ts INTEGER NOT NULL,
  latMin INTEGER NOT NULL,
  latMax INTEGER NOT NULL,
  longMin INTEGER NOT NULL,
  longMax INTEGER NOT NULL,
  undoed INTEGER DEFAULT 0
);

-- this is streamed in
CREATE TABLE brushItxItems (
  itxId INTEGER NOT NULL,
  ts INTEGER NOT NULL,
  latMin INTEGER NOT NULL,
  latMax INTEGER NOT NULL,
  longMin INTEGER NOT NULL,
  longMax INTEGER NOT NULL
);

CREATE TABLE brushItx(
  itxId INTEGER PRIMARY KEY,
  ts INTEGER NOT NULL,
  mapItxId INTEGER
);

CREATE TABLE mapCurrentItxId (
  itxId INTEGER NOT NULL UNIQUE,
  ts INTEGER NOT NULL
);

-- many pin could map to the same pinData
CREATE TABLE pinData (
  -- itxId INTEGER NOT NULL,
  userId TEXT NOT NULL,
  long INTEGER NOT NULL,
  lat INTEGER NOT NULL,
  UNIQUE(userId, long, lat)
);

CREATE TABLE userData (
  userId TEXT NOT NULL UNIQUE,
  Q1 INTEGER NOT NULL,
  Q2 INTEGER NOT NULL,
  Q3 INTEGER NOT NULL,
  Q4 INTEGER NOT NULL
);

CREATE TABLE userDataRequest (
  userId TEXT PRIMARY KEY,
  ts INTEGER
);

CREATE TABLE pinResponses (
  itxId INTEGER NOT NULL UNIQUE,
  ts INTEGER
);

CREATE TABLE pinStreamingInstance (
  ts INTEGER
);

CREATE TABLE renderItxs(
  mapItxId INTEGER NOT NULL,
  brushItxId INTEGER,
  cause TEXT NOT NULL,
  ts INTEGER,
  UNIQUE(mapItxId, brushItxId, cause, ts)
);