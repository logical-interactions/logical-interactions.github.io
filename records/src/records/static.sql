-- not going to coordinate the itxIds across the two for now; just going to use the ts. itxId only need to be compared across for time issues, in which case we can just use the ts.

-- all interactions so far will be zooms or panning
CREATE TABLE mapInteractions (itxId INTEGER PRIMARY KEY, ts INTEGER, latMin INTEGER, latMax INTEGER, longMin INTEGER, longMax INTEGER, undoed INTEGER DEFAULT 0, itxType TEXT);

-- the most recent item of this tables corresponds to the state
-- what are you rendering? the component states
-- CREATE TABLE brushSelection(itxId INTEGER, ts INTEGER, mapNavItxId);

-- no need to track rendering for anything that's assumed to be synchronous, e.g. the navigatio and brushing state --- they will be the most recent, respectively of mapRequests and of brushItx
-- what does need to be logged is perhaps whether the pin is up to date
-- when the pin is rendering, we somehow need to lock 


-- the brush needs to end the interaction
CREATE TABLE brushItx(itxId INTEGER PRIMARY KEY, ts INTEGER, mapItxId INTEGER);

-- this is streamed in
-- assume that this will be clipped to some reasonable boundary
CREATE TABLE brushItxItems (itxId INTEGER, ts INTEGER, latMin INTEGER, latMax INTEGER, longMin INTEGER, longMax INTEGER);

-- can look up itxType to get the request type? but might not always be the case that there is a 1:1 mapping
-- split for now...
CREATE TABLE mapRequests (itxId INTEGER, ts INTEGER);

-- experiment with brushing just the countries -- streamed in, and the streamed results can load in the cache and be reused
CREATE TABLE brushRequests (itxId INTEGER, ts INTEGER);

-- many pin could map to the same pinData
-- overloading this itxId
CREATE TABLE pinData (itxId INTEGER, userId TEXT, long INTEGER, lat INTEGER);

CREATE TABLE userData (userId TEXT, Q1 INTEGER, Q2 INTEGER, Q3 INTEGER, Q4 INTEGER);

-- see https://sqlite.org/foreignkeys.html
-- cannot really use FOREIGN KEY(dataId) REFERENCES pinData(itxId)
-- since it's not unique...
-- if dataId is null, then it's referencing it self
CREATE TABLE pinResponses (itxId INTEGER, ts INTEGER, dataId INTEGER);
CREATE TABLE pinRender(itxId INTEGER, ts INTEGER);

-- CREATE TABLE barRender(itxId INTEGER, ts INTEGER);

-- states
CREATE TABLE mapState(itxId INTEGER, ts INTEGER, latMin INTEGER, latMax INTEGER, longMin INTEGER, longMax INTEGER);

CREATE TABLE pinState(itxId INTEGER, ts INTEGER, lat INTEGER, long INTEGER);