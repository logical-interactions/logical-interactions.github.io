-- low and high of -1 are indication of clearing brush.

create table itx (
  sn INTEGER PRIMARY KEY,
  ts INTEGER NOT NULL,
  low INTEGER NOT NULL,
  high INTEGER NOT NULL,
  relativeLow INTEGER,
  relativeHigh INTEGER,
  -- window, userBrush, reactiveBrush
  itxType TEXT NOT NULL,
  -- ugh this is caps for random reasons... 
  -- scale or data
  itxFixType TEXT
);

create table itxBlockingHelper (
  ts INTEGER NOT NULL,
  -- either start or end
  eType TEXT NOT NULL
);

create table scatterItx (
  sn INTEGER PRIMARY KEY,
  tx INTEGER NOT NULL,
  xlow INTEGER NOT NULL,
  ylow INTEGER NOT NULL,
  xhigh INTEGER NOT NULL,
  yhigh INTEGER NOT NULL,
);


-- create table itxTracking (
--   ts INTEGER NOT NULL,
--   -- "enter" or "exit"
--   itxType TEXT
-- );