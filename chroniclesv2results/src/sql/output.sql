-- these are views sensitive to interactions
create view currentTaskSelectionInput as
  select 
    t.wId as wId,
    t.qId as qId,
    t.startTime as startTime,
    t.endTime as endTime
  from (
      select * from taskSelectionInput
      where ts = (select max(ts) from taskSelectionInput)
    ) s
    join aggTaskInfo t
      on t.wId = s.wId
      and t.qId = s.qId;

create view brushItxInTaskSelection as
  select
    b.itxStart as itxStart,
    b.itxEnd as itxEnd,
    b.itxId as itxId
  from brushItxTraces b
    join currentTaskSelectionInput s
      on b.wId = s.wId
      and b.qId = s.qId;

create view chroniclesItxInTaskSelection as
  select
    d.ts as ts,
    d.itxType as itxType
  from chroniclesItxTraces d
    join currentTaskSelectionInput s
      on d.wId = s.wId
      and d.qId = s.qId;