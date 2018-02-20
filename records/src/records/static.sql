-- all interactions so far will be zooms or panning
CREATE TABLE mapInteractions (itxId INTEGER PRIMARY KEY, ts INTEGER, latMin INTEGER, latMax INTEGER, longMin INTEGER, longMax INTEGER);

CREATE TABLE mapRequests (itxId INTEGER, ts INTEGER);

-- many pin could map to the same pinData
CREATE TABLE pinData (dataId INTEGER PRIMARY KEY, long INTEGER, lat INTEGER);

-- see https://sqlite.org/foreignkeys.html
CREATE TABLE pinResponses (itxId INTEGER, ts INTEGER, dataId INTEGER, FOREIGN KEY(dataId) REFERENCES pinData(dataId));

CREATE TABLE barResponese (itxId INTEGER, ts INTEGER, x TEXT, y INTEGER);

-- states
CREATE TABLE mapState(itxId INTEGER, ts INTEGER, latMin INTEGER, latMax INTEGER, longMin INTEGER, longMax INTEGER);

CREATE TABLE pinState(itxId INTEGER, ts INTEGER, lat INTEGER, long INTEGER);

CREATE TEMP TABLE IF NOT EXISTS Variables (Name TEXT PRIMARY KEY, Value TEXT); 