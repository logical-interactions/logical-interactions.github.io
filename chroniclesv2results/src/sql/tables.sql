create table if not exists charts as
select 'day' as chart
union select 'state'
union select 'carrier'
union select 'delays';

drop table if exists workerCmds;
create table workerCmds (
  commands text
);

drop table if exists navigateItx;
create table navigateItx (
  itxId INTEGER PRIMARY KEY,
  ts INTEGER NOT NULL,
  xFilterItxId INTEGER NOT NULL,
  FOREIGN KEY(xFilterItxId) REFERENCES xBrushItx(itxId)
);

create table deltaItx (
  itxId INTEGER PRIMARY KEY,
  ts INTEGER NOT NULL,
  val integer not null -- 1 or -1
);

create table deleteItx (
  itxId INTEGER PRIMARY KEY,
  ts INTEGER NOT NULL
);

-- remove brush just gets mapped back to all the data being selected
drop table if exists xBrushItx;
CREATE TABLE xBrushItx (
  itxId INTEGER PRIMARY KEY,
  ts INTEGER NOT NULL,
  chart TEXT NOT NULL,
  -- this is used for set specific selections; e.g., carrier
  selection TEXT,
  low INTEGER,
  high INTEGER,
  -- the following 2 are for two dimensional filters
  low2 INTEGER,
  high2 INTEGER
);

-- initializing here so that react would not have nulls to deal with
insert into xBrushItx (ts, chart)
  select
    timenow(),
    c.chart
  from
    charts c;

-----------------------------------
--------- State programs ----------
-----------------------------------
drop table if exists itxId_SP;
create table itxId_SP (
  itxId INTEGER NOT NULL,
  ts INTEGER NOT NULL,
  FOREIGN KEY(itxId) REFERENCES xBrushItx(itxId)
);

-- dummy ts
insert into itxId_SP values (4, 0);

-- each itxId should have 4 corresponding with it to indicate what their filters were.
-- not exactly normalized to avoid hyper joining...
drop table if exists brushState_SP;
create table brushState_SP (
  itxId INTEGER NOT NULL,
  chart TEXT NOT NULL,
  componentItx INTEGER NOT NULL,
  FOREIGN KEY(itxId) REFERENCES xBrushItx(itxId)
);

insert into brushState_SP
  select
    4,
    c.chart,
    c.itxId
  from
    xBrushItx c;

drop table if exists brushDep_SP;
create table brushDep_SP (
  itxId INTEGER NOT NULL,
  pastItxId INTEGER NOT NULL,
  FOREIGN KEY(itxId) REFERENCES xBrushItx(itxId)
);

create table dataParamHashes_SP (
  itxId INTEGER NOT NULL,
  chart text not null,
  hashVal text not null,
  UNIQUE(itxId, chart)
);

insert into dataParamHashes_SP 
  select
    4,
    c1.chart,
    group_concat(c2.chart || ':NULL,NULL,NULL,NULL,NULL','-')
  from
    charts c1
    join charts c2
    where c1.chart != c2.chart
  group by c1.chart;

-- directly derived from above
create table eqChart_SP (
  newItxId INTEGER NOT NULL,
  chart text not null,
  oldItxId INTEGER NOT NULL,
  unique(newItxId, chart)
);

----------------------------
---- non reactive state ----
----------------------------

drop table if exists eventLog;
CREATE TABLE eventLog (
  ts INTEGER NOT NULL,
  eventName TEXT NOT NULL,
  parameter TEXT
);

-- keeping track of this helps
-- with experiment versioning
create table taskInfo (
  qId text PRIMARY key,
  taskType text not null,
  isTraining integer not null
);

create table memoryTask (
  qId text primary key,
  linkedQId text not null,
  foreign key(qId) REFERENCES taskInfo(qId),
  foreign key(linkedQId) REFERENCES taskInfo(qId)
);

create table taskTimes (
  qId text not null,
  ts integer not null,
  eventType text not null, -- view, start or end
  foreign key(qId) REFERENCES taskInfo(qId)
);

create table answers (
  qId text not null,
  answer text not null,
  confidence text not null,
  score integer not null,
  comment text,
  foreign key(qId) REFERENCES taskInfo(qId)
);

------------------------------
--------- data events --------
------------------------------

drop table if exists stateChartData;
CREATE TABLE stateChartData (
  itxId INTEGER NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  FOREIGN KEY(itxId) REFERENCES xBrushItx(itxId)
);

drop table if exists dayChartData;
CREATE TABLE dayChartData (
  itxId INTEGER NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  FOREIGN KEY(itxId) REFERENCES xBrushItx(itxId)
);

drop table if exists carrierChartData;
CREATE TABLE carrierChartData (
  itxId INTEGER NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  FOREIGN KEY(itxId) REFERENCES xBrushItx(itxId)
);

drop table if exists delaysChartData;
CREATE TABLE delaysChartData (
  itxId INTEGER NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  v INTEGER NOT NULL,
  FOREIGN KEY(itxId) REFERENCES xBrushItx(itxId)
);

drop table if exists chartDataAtomic;
CREATE TABLE chartDataAtomic (
  ts integer not null,
  itxId INTEGER NOT NULL,
  chart INTEGER NOT NULL,
  UNIQUE(itxId, chart),
  FOREIGN KEY(itxId) REFERENCES xBrushItx(itxId)
);

------------------------- 
----- initial data ------
------------------------- 

-- depends on why this was cleared out --- if this was cleared out by the user
-- in the same session then do not remove
CREATE TABLE if not exists stateChartInitData (
  x INTEGER NOT NULL,
  y INTEGER NOT NULL
);

CREATE TABLE if not exists dayChartInitData (
  x INTEGER NOT NULL,
  y INTEGER NOT NULL
);

CREATE TABLE if not exists carrierChartInitData (
  x INTEGER NOT NULL,
  y INTEGER NOT NULL
);

CREATE TABLE if not exists delaysChartInitData (
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  v INTEGER NOT NULL
);
