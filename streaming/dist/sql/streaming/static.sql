create table events (
  -- emulate minute since
  ts INTEGER,
  -- sales amount
  val INTEGER,
  id TEXT,
  -- demographic
  a TEXT,
  -- ad campaign
  b TEXT
);

-- new values of the user time spent on side and number of links can change
create table user (
  ts INTEGER,
  id TEXT,
  -- time spent on site
  -- doesn't have to increase monotonically
  c INTEGER,
  -- number of links clicked
  d INTEGER
);

--modify events table to include timestamp/id for different values of data at different times
create table scatter (
  id TEXT,
  ts INTEGER,
  xval INTEGER,
  yval INTEGER
);