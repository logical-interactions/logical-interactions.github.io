-- if we want to unify this... the past ItxId could just be the highest one.

create view presentBrush as 
    select *
    from xBrushItx
    where itxId = (select max(itxId) from xBrushItx);

-- the brush also needs to account for what the current stat eof interactions there is, if any; this can be done by doing a time cuttoff.
create view currentItx as
  select * from presentBrush
  union 
  select
    stateBrush.*
  from
    presentBrush
    inner left join (
      SELECT
        o.*
      FROM xBrushItx o
        LEFT JOIN xBrushItx b
            ON o.chart = b.chart
            AND o.itxId < b.itxId
      WHERE
        b.itxId is NULL
        and b.itxId < presentBrush.pastItxId
        and o.chart != presentBrush.chart
    ) as stateBrush
  ;




-- CREATE VIEW currentItx AS
--   SELECT
--     o.*
--   FROM xBrushItx o
--     LEFT JOIN xBrushItx b
--         ON o.chart = b.chart AND o.ts < b.ts
--   WHERE b.ts is NULL;
  -- SELECT
  --   chart,
  --   MAX(itxId) AS itxId
  -- FROM
  --   xBrushItx
  -- GROUP BY chart;


not on chartData because that would be triggered too many times
CREATE TRIGGER xFilterAtomicResponse AFTER INSERT ON chartDataAtomic
BEGIN
  -- if all the charts are here
  -- SELECT log(NEW.requestId, 'xFilterAtomicResponse');
  INSERT INTO xFilterResponse(requestId, ts, dataId, chart)
  SELECT
    NEW.requestId,
    timeNow(),
    NEW.requestId,
    NEW.chart
  FROM (
    SELECT GROUP_CONCAT(DISTINCT chart) AS val
    FROM chartData d
    WHERE d.requestId = NEW.requestId) charts
  -- WHERE checkAtomic(charts.val) = 1;
END;


CREATE TABLE xFilterResponse (
  requestId INTEGER NOT NULL,
  ts INTEGER NOT NULL,
  -- can be a previous requestId, or the currentone
  dataId INTEGER NOT NULL,
  -- finer grained tracking
  chart TEXT NOT NULL,
  UNIQUE(requestId, chart)
);


CREATE TABLE scatterData (
  requestId INTEGER NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
);

-- send request to worker if response is not present
  INSERT INTO chartDataAtomic (requestId, chart)
  SELECT
    NEW.requestId,
    req.chart
  FROM xFilterRequest req
  WHERE
    req.requestId != NEW.requestId
    AND yearLow = NEW.yearLow AND yearHigh = NEW.yearHigh
    AND monthLow = NEW.monthLow AND monthHigh = NEW.monthHigh
    AND carrierSet = NEW.carrierSet
    -- FIXME: also add the filter for the delays here
    ;