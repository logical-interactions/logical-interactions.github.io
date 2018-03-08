-- performance: ts of interaction
-- minus the response ts
SELECT
  r.ts - i.ts
FROM
  xFilterRender r
  JOIN brushItx i ON r.itxId = i.itxId;

-- this will already be in the DB that's loaded in
-- preprocessed at /preproc/xfilter_prep.html

CREATE TABLE binnedData (
  month INTEGER,
  hour INTEGER,
  delay INTEGER,
  distance INTEGER,
  origin TEXT,
  destination TEXT
);

-- these files are NOT ran, just used in development 
-- original data
-- none of the file items are keywords
-- date,delay,distance,origin,destination
-- 01010001,14,405,MCI,MDW
CREATE TABLE flight (
  date TEXT,
  delay INTEGER,
  distance INTEGER,
  origin TEXT,
  destination TEXT
);

CREATE VIEW binnedDataView AS
  SELECT
    CAST(SUBSTR(flight.date, 0, 1) AS INTEGER) AS month,
    CAST(SUBSTR(flight.date, 5, 1) AS INTEGER) AS hour,
    CAST(flight.delay - delayRange.low) AS INTEGER / delayRange.val AS INTEGER) AS delay,
    CAST(flight.distance - distanceRange.low) AS INTEGER / distanceRange.val AS INTEGER) AS distane,
    origin,
    destination
  FROM flight,
    (
      SELECT 
        (MAX(d.delay) - MIN(d.delay)) / 20 AS val,
        MIN(d.delay) AS low
      FROM flight AS d
    ) AS delayRange,
    (
      SELECT 
        (MAX(d.distance) - MIN(d.distance)) / 20 AS val,
        MIN(d.distance) AS low
      FROM flight AS d
    ) AS distanceRange;