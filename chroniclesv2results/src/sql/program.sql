
-- using 1/0 here for performance
-- server IsChronicles is 'true' for sanity (just in case 1/0 were flipped...)

drop table if exists workerInfo;
-- we can insert information here for easier pivoting for analysis
create table workerInfo(
  wId text not null,
  -- 1 is true, 0 is false
  IsChronicles integer not null
);
insert into workerInfo (IsChronicles, wId)
  select
    parameter = 'true',
    wId
  from eventLog
  where eventName = 'IsChronicles';

drop table if exists aggTaskInfo;
create table aggTaskInfo (
  wId text not null,
  qId text not null,
  score real not null,
  startTime integer not null,
  endTime integer not null,
  timeTaken integer not null,
  unique(wId, qId)
);

insert into aggTaskInfo 
  select
    a.wId,
    a.qId,
    a.score,
    tStart.ts,
    tEnd.ts,
    tEnd.ts - tStart.ts
  from
    answers a
    join (
      select
        qId,
        ts,
        wId
      from taskTimes t
      where eventType = 'start'
    ) tStart on
      a.qId = tStart.qId
      and tStart.wId = a.wId
    join (
      select
        qId,
        ts,
        wId
      from taskTimes t
      where eventType = 'end'
    ) tEnd on
      tStart.qId = tEnd.qId
      and tStart.wId = tEnd.wId;

drop table if exists sliceByChronicles;
create table sliceByChronicles (
  qId text primary key,
  avgScore real not null check (avgScore <= 1 and avgScore >= 0),
  avgTime integer not null
);

insert into sliceByChronicles
  select
    qId,
    round(avg(r.score),3) as avgScore,
    round(avg(r.timeTaken)) as avgTime
  from
    aggTaskInfo r
    join workerInfo i
  group by r.qId, i.IsChronicles;

-- helper views
drop table if exists cachedItx;
create table cachedItx (
  wId text not null,
  qId text not null check (qId > 5),
  itxId integer not null,
  unique(wId, qId, itxId)
);

insert into cachedItx (wId, qId, itxId)
  select
    b.wId,
    t.qId,
    b.itxId
  from
    aggTaskInfo t
    join xBrushItx b
      on t.wId = b.wId
      and b.ts < t.endTime
      and b.ts > t.startTime
    join eqChart_SP e on
      e.wId = b.wId
      -- OK this is the only time this is allowed
      and e.TaskId = b.TaskId
      and e.newItxId = b.itxId
  where b.itxId > 5
  group by b.wId, t.qId, b.itxId
  having count() = 4;

drop table if exists interactionCountPerTask;
create table interactionCountPerTask(
  wId text not null,
  qId text not null,
  itxCount integer not null,
  unique(wId, qId)
);

insert into interactionCountPerTask (wId, qId, itxCount)
  select
    t.wId,
    t.qId,
    count(b.itxId)
  from
    aggTaskInfo t
    join xbrushItx b
      on b.ts < t.endTime
      and b.ts > t.startTime
      and b.wId = t.wId
    group by t.wId, t.qId;

create table itxLoadedTime (
  wId text not null,
  qId text not null,
  itxId text not null,
  startTime number not null,
  endTime number not null check (endTime >= startTime),
  unique(wId, qId, itxId)
);

insert into itxLoadedTime (wId, qId, itxId, startTime, endTime)
  select
    b.wId,
    t.qId,
    b.itxId,
    b.ts,
    -- this is because I made a logging msitake and the latency is 3 to 5 seconds; this will have to change 
    max(a.ts) + 3000
  from
    xBrushItx b
    join aggTaskInfo t
      on b.wId = t.wId
      and b.ts < t.endTime
      and b.ts > t.startTime
    join chartDataAtomic a
      on b.wId = a.wId
      and b.taskId = a.taskId
      and b.itxId = a.itxId
    group by b.wId, b.itxId, t.qId;

drop table if exists itxConcurrency;
create table itxConcurrency(
  wId text not null,
  qId text not null,
  itxId text not null,
  nextItxTs integer not null,
  lastLoadedChartTs integer not null,
  unique(wId, qId, itxId)
);

insert into itxConcurrency
  select
    t.wId as wId,
    t.qId as qId,
    b1.itxId as itxId,
    b2.ts as nextItxTs,
    max(a.ts) as lastLoadedChartTs
  from
    xBrushItx b1
    join aggTaskInfo t on
      b1.wId = t.wId
      and b1.ts < t.endTime
      and b1.ts > t.startTime
    join xbrushItx b2 on
      b1.wId = b2.wId
      and b2.taskId = b1.taskId
      and b2.itxId = b1.itxId + 1
    -- should not be a left outer join
    join chartDataAtomic a on
      b2.wId = a.wId
      and b2.taskId = a.taskId
      and b1.itxId = a.itxId
  group by t.wId, t.qId, b1.itxId;

drop table if exists percentConcurrent;
create table percentConcurrent(
  qId text primary key,
  IsChronicles integer not null,
  percent real not null
);

insert into percentConcurrent
  select
    c.qId,
    i.IsChronicles,
    CAST(sum(
      case when c.lastLoadedChartTs > c.nextItxTs then 1 else 0 end
    ) as real) / p.itxCount as percent
  from itxConcurrency c
    join workerInfo i
      on c.wId = i.wId
    join interactionCountPerTask p
      on p.wId = c.wId
      and p.qId = c.qId
  group by c.qId, i.IsChronicles;


drop table if exists percentCached;
create table percentCached (
  wId text not null,
  qId text not null,
  percent real not null CHECK (percent <= 1 and percent >= 0),
  unique(wId, qId)
);

insert into percentCached (wId, qId, percent)
  select
    p.wId,
    p.qId,
    CAST(count() as real) / p.itxCount as percent
  from
    cachedItx c
    join interactionCountPerTask p
      on p.wId = c.wId
      and p.qId = c.qId
  group by p.wId, p.qId;

drop table if exists countNavigation;
create table countNavigation(
  qId text primary key,
  navigateItx integer not null,
  deltaItx integer not null
);

insert into countNavigation
  select
    t.qId,
    count(n.ts) as navCount,
    count(d.ts) as deltaCount
  from
    aggTaskInfo t
    left outer join navigateItx n on
      n.wId = t.wId
      and t.startTime < n.ts
      and t.endTime > n.ts
    left outer join deltaItx d on
      d.wId = t.wId
      and t.startTime < d.ts
      and t.endTime > d.ts
    group by t.qId;
