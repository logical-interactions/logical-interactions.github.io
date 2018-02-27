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
  ts INTEGER, 
  mapItxId INTEGER
);

CREATE TABLE mapRequests (
  itxId INTEGER NOT NULL UNIQUE, 
  ts INTEGER NOT NULL
);

-- many pin could map to the same pinData
CREATE TABLE pinData (
  itxId INTEGER, 
  userId TEXT, 
  long INTEGER, 
  lat INTEGER
);

CREATE TABLE userData (
  userId TEXT NOT NULL UNIQUE, 
  Q1 INTEGER, 
  Q2 INTEGER, 
  Q3 INTEGER, 
  Q4 INTEGER
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
  cause TEXT NOT NULL
);