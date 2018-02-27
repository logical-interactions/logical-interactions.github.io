CREATE TABLE mapInteractions (
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

CREATE TABLE mapRequests (
  itxId INTEGER NOT NULL UNIQUE,
  ts INTEGER NOT NULL
);

-- many pin could map to the same pinData
CREATE TABLE pinData (
  itxId INTEGER NOT NULL,
  userId TEXT NOT NULL,
  long INTEGER NOT NULL,
  lat INTEGER NOT NULL
);

CREATE TABLE userData (
  userId TEXT NOT NULL UNIQUE,
  Q1 INTEGER NOT NULL,
  Q2 INTEGER NOT NULL,
  Q3 INTEGER NOT NULL,
  Q4 INTEGER NOT NULL
);

CREATE TABLE pinResponses (
  itxId INTEGER NOT NULL UNIQUE,
  ts INTEGER,
  dataId INTEGER
);

-- TODO: we probably need to log the render data in order to know what the current read situation is.
CREATE TABLE pinRender(
  itxId INTEGER NOT NULL UNIQUE,
  ts INTEGER NOT NULL
);

-- TODO: somehow insert this sometime...
CREATE TABLE renderHistory(
  mapItxId INTEGER NOT NULL,
  brushItxId INTEGER,
  cause TEXT NOT NULL,
  ts INTEGER
);