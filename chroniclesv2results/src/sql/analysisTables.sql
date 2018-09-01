
-- additional tracking for wId to taskIds
create table workerTasks(
  wId text not null,
  taskId text not null,
  UNIQUE(wId, taskId)
);

create table questionContent (
  qRank integer not null,
  qId text primary key,
  question text not null
);

-- taskId is just for uniforminity
create table Demographics(
  wId text not null,
  qId text not null,
  answer integer not null
);

create table ToolSurvey(
  wId text not null,
  qId text not null,
  answer integer not null
);

create table FlowSurvey(
  wId text not null,
  qId text not null,
  answer integer not null
);

create table CancelSurvey(
  wId text not null,
  qId text not null,
  answer integer not null
);