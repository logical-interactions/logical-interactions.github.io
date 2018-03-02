-- insert to test the trigger

INSERT INTO mapInteractions (ts, longMin, latMax, longMax, latMin) VALUES (1992, -149, 75, 150, -75);


-- undo, naive, select the state before, and stuff it there, mark the the most recent as skip --> it's idempotent (does that matter?)

-- mark the current as undoed
UPDATE mapInteractions
  SET undoed = 1 WHERE itxId IN (SELECT itxId FROM mapInteractions ORDER BY itxId DESC LIMIT 1);
INSERT INTO mapInteractions (ts, latMin, latMax, longMin, longMax)
  -- select the last thing that was not UNDO and NOT the current one
  SELECT timeNow(), latMin, latMax, longMin, longMax
  FROM mapInteractions
  WHERE undoed = 0
  ORDER BY itxId DESC LIMIT 1;
-- also need to set the last one to be 1

UPDATE mapInteractions
  SET undoed = 1 
  WHERE itxId IN (
    SELECT itxId
    FROM mapInteractions
    WHERE undoed = 0
    ORDER BY itxId DESC LIMIT 1);


select * from mapInteractions;

CREATE TABLE mapInteractions (itxId INTEGER PRIMARY KEY, ts INTEGER, latMin INTEGER, latMax INTEGER, longMin INTEGER, longMax INTEGER, undoed INTEGER DEFAULT 0);
INSERT INTO mapInteractions (ts, longMin, latMax, longMax, latMin) VALUES (1992, -149, 75, 150, -75);
INSERT INTO mapInteractions (ts, longMin, latMax, longMax, latMin) VALUES (1993, -19, 7, 15, -5);
INSERT INTO mapInteractions (ts, longMin, latMax, longMax, latMin) VALUES (1994, -29, 17, 1, -15);
  UPDATE mapInteractions
    SET undoed = 1 WHERE itxId IN (SELECT itxId FROM mapInteractions ORDER BY itxId DESC LIMIT 1);
  INSERT INTO mapInteractions (ts, latMin, latMax, longMin, longMax, undoed)
    SELECT 1999, latMin, latMax, longMin, longMax, 2
    FROM mapInteractions
    WHERE undoed = 0
    ORDER BY itxId DESC LIMIT 1;
  UPDATE mapInteractions
    SET undoed = 1
    WHERE itxId IN (
      SELECT itxId
      FROM mapInteractions
      WHERE undoed = 0
      ORDER BY itxId DESC LIMIT 1);
  -- then set it back to 1
  UPDATE mapInteractions
    SET undoed = 0 WHERE undoed = 2;



CREATE TABLE brushItxItems (itxId INTEGER, ts INTEGER, country TEXT);
CREATE TABLE currentBrushItx (itxId INTEGER);
INSERT INTO currentBrushItx VALUES (1);
INSERT INTO brushItxItems (ts, country) VALUES (1000, 'usa');



UPDATE brushItxItems
  SET brushItxItems.itxId = (SELECT itxId FROM currentBrushItx)
  WHERE
    brushItxItems.ts = 1000
    AND brushItxItems.country = 'usa';