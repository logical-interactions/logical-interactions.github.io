-- low and high of -1 are indication of clearing brush.

create table itx (
  sn INTEGER PRIMARY KEY,
  ts INTEGER NOT NULL,
  low INTEGER,
  high INTEGER,
  -- window or brush
  itxType TEXT
);

CREATE TABLE brushItxRender (
  itxId INTEGER,
  ts INTEGER NOT NULL
);
