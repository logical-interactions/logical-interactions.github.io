-- create materialized versions of task traces so we can work with
create table allCorrectNonMemTasks (
  wId text not null,
  qId text not null,
  startTime integer not null,
  endTime integer not null,
  unique(wId, qId)
);

insert into allCorrectNonMemTasks
  select
    i.wId,
    i.qId,
    i.startTime,
    i.endTime
  from aggTaskInfo i
    join taskInfo t
      on t.qId = i.qId
      and t.wId = i.wId
  where
    t.taskType != 'Recall'
    and i.score = 1;

-- should double check that there is no repeated itxId
create table brushItxTraces (
  wId text not null,
  qId text not null,
  itxStart integer not null,
  itxEnd integer not null,
  itxId integer not null
);

insert into brushItxTraces
  select
    s.wId,
    s.qId,
    b.ts as itxStart,
    b.ts as itxEnd, -- since it's cached
    b.itxId as itxId
  from xBrushItx b
    join aggTaskInfo s
      on b.wId = s.wId
      and b.ts > s.startTime
      and b.ts < s.endTime
    join cachedItx c
      on c.wId = b.wId
      and c.qId = s.qId
      and c.itxId = b.itxId
  union
  select
    s.wId,
    s.qId,
    l.startTime,
    l.endTime,
    l.itxId
  from xBrushItx b
    join aggTaskInfo s
      on b.wId = s.wId
      and b.ts > s.startTime
      and b.ts < s.endTime
    join itxLoadedTime l
      on l.wId = s.wId
      and l.qId = s.qId
      and l.itxId = b.itxId;

create table chroniclesItxTraces (
  wId text not null,
  qId text not null,
  ts integer not null,
  itxType text not null check (itxType = 'delta' or itxType = 'navigate')
);

insert into chroniclesItxTraces
  select
    s.wId,
    s.qId,
    d.ts as ts,
    'delta' as itxType
  from deltaItx d
    join aggTaskInfo s
      on d.wId = s.wId
      and d.ts > s.startTime
      and d.ts < s.endTime
  union
  select
    s.wId,
    s.qId,
    n.ts as ts,
    'navigate' as itxType
  from navigateItx n
    join aggTaskInfo s
      on n.wId = s.wId
      and n.ts > s.startTime
      and n.ts < s.endTime;

-- having a reduce here would be really nice...
drop table if exists taskCompletionTimes;
create table taskCompletionTimes (
  qId text primary key,
  qRank integer not null,
  question text not null,
  correctTimes text,
  incorrectTimes text
);

insert into taskCompletionTimes (qId, qRank, question, correctTimes, incorrectTimes)
  select
    i.qId,
    q.qRank,
    q.question,
    group_concat(case when i.score = 1 then i.timeTaken || '-' || i.wId end, ','),
    group_concat(case when i.score < 1 then i.timeTaken || '-' || i.wId end, ',')
  from aggTaskInfo i
    join taskInfo t
      on t.qId = i.qId
      and t.wId = i.wId
    join questionContent q
      on q.qId = t.qId
  where t.taskType != 'Recall'
  group by i.qId;


drop table if exists successCountPerWorker;
create table successCountPerWorker as
  select
    t.wId as wId,
    t.isTraining as isTraining,
    count() as countCorrect
  from
    answers a
    join taskInfo t on
      a.wId = t.wId
      and a.qId = t.qId
  where
    a.score = 1
  group by t.wId, t.isTraining;