create view currentBrush as
  select 
    itxId,
    coalesce(pastItxId, itxId - 1) as pastItxId,
    low,
    high,
    chart,
    selection,
    low2,
    high2
  from xBrushItx 
  where itxId = (SELECT MAX(itxId) AS itxId FROM xBrushItx);

create view pastOtherBrush as 
  select xBrushItx.*
  from currentBrush 
  join xBrushItx 
    on xBrushItx.itxId <= currentBrush.pastItxId
    and xBrushItx.chart != currentBrush.chart;

create view currentItx as 
  select
    itxId,
    pastItxId,
    low,
    high,
    chart,
    selection,
    low2,
    high2
   from currentBrush
  union 
  SELECT
    o.itxId,
    o.pastItxId,
    o.low,
    o.high,
    o.chart,
    o.selection,
    o.low2,
    o.high2
  FROM
    pastOtherBrush o
    LEFT JOIN pastOtherBrush b
        ON o.chart = b.chart
        AND o.itxId < b.itxId
  WHERE
    b.itxId is NULL
  ;

create view currentFilter as
SELECT
    id.itxId,
    timeNow() as ts,
    year.low,
    year.high,
    month.low,
    month.high,
    carrier.selection,
    delays.low,
    delays.high,
    delays.low2,
    delays.high2
  FROM
    (SELECT MAX(itxId) AS itxId FROM currentItx) AS id,
    (
      SELECT
        low,
        high
      FROM
        currentItx
      WHERE chart = 'year'
    ) AS year,
    (
      SELECT
        low,
        high
      FROM
        currentItx
      WHERE chart = 'month'
    ) AS month,
    (
      SELECT
        selection
      FROM
        currentItx
      WHERE chart = 'carrier'
    ) AS carrier,
    (
      SELECT
        low,
        high,
        low2,
        high2
      FROM
        currentItx
      WHERE chart = 'delays'
    ) AS delays
    ;

create view xFilterChronicles as
  SELECT
    d.chart,
    d.bin,
    d.count,
    req.itxId AS itxId
  FROM
    xFilterRequest req
    LEFT OUTER JOIN chartData d ON d.requestId = req.requestId;
  -- WHERE req.itxId IN (select itxId from activeItxs);

-- create view activeItxs as
--   select itxId
--   from xFilterRequest
--   ORDER BY itxId DESC;
  -- let's not limit anything
  -- this notion of a buffer is rather cumbersome
  -- LIMIT (select size from bufferSize order by ts limit 1);

create view xFilterLoaded as 
  select itxId, GROUP_CONCAT(chart) as charts
  from (
    select distinct
      req.itxId as itxId,
      res.chart as chart
    from chartData res
    join xFilterRequest req on res.requestId = req.requestId
    -- where req.itxId IN (select itxId from activeItxs)
  )
  group by itxId;

create view xFilterSelections as
  select
    req.itxId,
    req.monthLow, req.monthHigh,
    req.yearLow, req.yearHigh,
    req.arrDelayLow, req.arrDelayHigh,
    req.depDelayLow, req.depDelayHigh,
    req.carrierSet
  from xFilterRequest req;
  -- where req.itxId IN (select itxId from activeItxs)
  -- ORDER BY itxId DESC;

-- the 0 is so that we can reuse parsing on the javascript side
-- to keep the same structure
create view initialState as
  SELECT
    d.chart, d.bin, d.count, 0 AS itxId
  FROM
    chartData d
    JOIN xFilterRequest r ON d.requestId = r.requestId
  WHERE
    r.yearLow IS NULL AND r.yearHigh IS NULL
    AND r.monthLow IS NULL AND r.monthHigh IS NULL
    AND r.carrierSet IS NULL
    AND r.arrDelayLow IS NULL AND r.arrDelayHigh is null
    and r.depDelayLow is null and r.depDelayHigh is null;