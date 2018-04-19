create view currentBrush AS
  select * from itx
  where sn = (select max(sn) from itx where itxType = 'brush')
  and low > 0 and high > 0;

create view currentWindow AS
  select * from itx
  where sn = (select max(sn) from itx where itxType = 'window');

-- if there is a non empty brush take brush
-- otherwise take most recent window
create view currentFilter AS
  select * from itx 
  where sn = (select COALESCE(b.itx, w.itx) from 
  currentWindow b, currentWindow w);

-- data should be filtering others
create view filteredDataView AS
  select *
  from events e, currentFilter b
  where e.ts < b.high and e.ts > b.low;


-- 
-- below are the frame mappings
-- 

create view chartTimeData AS
  select ts, val
  from events e join
    currentWindow c on e.ts < c.high and e.ts > c.low;

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

create view currentView AS
  select 