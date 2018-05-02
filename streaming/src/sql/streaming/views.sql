create view currentUserBrush AS
  select * from itx
  where sn = (select max(sn) from itx where itxType = 'userBrush')
  and low > -1 and high > -1;

create view currentBrush AS
  select * from itx
  where sn = (select max(sn) from itx where itxType != 'window')
  and low > -1 and high > -1;

-- might need to reevaluate view if the policy is consistent
create view currentWindow AS
  select * from itx
  where sn = (select max(sn) from itx where itxType = 'window');

create view visibleBrush AS
  select b.sn
  from currentBrush b join currentWindow w
    on b.high > w.low;

-- select last window used by FIXED interaction trigger
-- create view lastWindow AS
--   select * from itx
--   where sn = (select min(sn) from itx order by sn DESC limit 2);

-- take most recent itx
-- unless there is currently a brush in view
create view currentFilter AS
  select * 
  from itx
  where sn = (select coalesce(b.sn, w.sn) from currentWindow w left outer join visibleBrush b);
  

  -- where low > -1 and high > -1
  -- order by ts DESC limit 1;

-- data should be filtering others
create view filteredDataView AS
  select *
  from events e, currentFilter b
  where e.ts < b.high and e.ts > b.low;

-- 
-- below are only used for frame mappings
-- 
create view allHistoryRange AS
  select min(low), max(high)
  from itx where itxType = 'window';

create view allBrushes AS
  select low, high
  from itx
  where itxType != 'window'; 

create view chartTimeData AS
  select e.ts, e.val
  from
    events e 
    join currentWindow c 
    on e.ts < c.high and e.ts > c.low;

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