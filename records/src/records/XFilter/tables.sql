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

-- remove brush just gets mapped back to all the data being selected
CREATE TABLE brushItx (
  itxId INTEGER PRIMARY KEY,
  ts INTEGER,
  low INTEGER NOT NULL,
  high INTEGER NOT NULL,
  chart TEXT
);

CREATE TABLE filters (
  filterId INTEGER PRIMARY KEY,
  hourItxId INTEGER NOT NULL,
  delayItxId INTEGER NOT NULL,
  distanceId INTEGER NOT NULL,
  UNIQUE(hourItxId, delayItxId, distanceId)
);

CREATE TABLE brushRequest (
  itxId INTEGER PRIMARY KEY,
  filterId INTEGER,
  ts INTEGER
);


-- TODO: caching!

-- CREATE TABLE hourChartData (
--   filterId INTEGER PRIMARY KEY,
--   hourBin INTEGER,
--   count INTEGER,
-- );

-- CREATE TABLE delayChartData (
--   filterId INTEGER PRIMARY KEY,
--   delayBin INTEGER,
--   count INTEGER,
-- );

-- CREATE TABLE distanceChartData (
--   filterId INTEGER PRIMARY KEY,
--   distanceBin INTEGER,
--   count INTEGER,
-- );