create view currentUserBrush AS
  select * from itx
  where sn = (select max(sn) from itx where itxType = 'userBrush')
  and low > -1 and high > -1;

create view currentBrush AS
  select * from itx
  where sn = (select max(sn) from itx where itxType != 'window')
  and low > -1 and high > -1;

-- this window is user clipped
-- user can also chose to unclip
create view currentWindowUser AS
  select * from itx
  where sn = (select max(sn) from itx where itxType = 'window')
  and low > -1 and high > -1;

-- the past 10 secon data
create view currentWindow AS
  select
    coalesce(u.low, max(e.ts) - 120*1000) as low,
    coalesce(u.high, max(e.ts)) as high
  from events e
  left outer join currentWindowUser u;

create view visibleBrush AS
  select b.low, b.high
  from currentBrush b join currentWindow w
    on b.high > w.low;

-- take most recent itx
-- unless there is currently a brush in view
create view currentFilter AS
  select
    coalesce(b.low, w.low) as low,
    coalesce(b.high, w.high) as high
  from currentWindow w
    left outer join visibleBrush b;

-- data should be filtering others
create view filteredDataView AS
  select e.*
  from events e, currentFilter b
  where e.ts < b.high and e.ts > b.low;
  
create view filteredDataTableView as
  select * from filteredDataView e
  order by e.ts desc;

-- 
-- below are only used for frame mappings
-- 
create view allHistoryRange AS
  select min(ts), max(ts)
  from events;

create view allBrushes AS
  select low, high
  from itx
  where itxType != 'window'; 

-- group by minutes
create view chartTimeDataBase AS
  select
    -- group by 20 second chunks
    round(e.ts / 20000, 0) * 20000 as bin,
    e.ts,
    e.val
  from
    events e 
    join currentWindow c 
    on e.ts < c.high and e.ts > c.low;

create view chartTimeData AS
select bin, sum(val)
from chartTimeDataBase
group by bin;

create view chartAData AS
  SELECT
    a AS bin,
    COUNT(*) AS count
  FROM filteredDataView
  GROUP BY a;

create view chartBData AS
  SELECT
    b AS bin,
    COUNT(*) AS count
  FROM filteredDataView
  GROUP BY b;

create view chartScatterData AS
  select c, d
  from filteredDataView;