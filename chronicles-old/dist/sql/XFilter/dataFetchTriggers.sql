-- see if the data is in brushRequest
-- if not, go compute
-- else, render

CREATE TRIGGER afterBrushItx AFTER INSERT ON xBrushItx
-- everytime there is an arrDelay, there will be a depDelay that follows
BEGIN
  -- TOOD: add throttling
  SELECT log(NEW.itxId || ': (' || NEW.chart || ') ' || NEW.low || ' - ' || NEW.high || ' - ' || NEW.selection, 'afterBrushItx');
  INSERT INTO xFilterRequest (itxId, ts, yearLow, yearHigh, monthLow, monthHigh, carrierSet, arrDelayLow, arrDelayHigh, depDelayLow, depDelayHigh)
  select * from currentFilter;
END;

CREATE TRIGGER afterBrushRequestItx AFTER INSERT ON xFilterRequest
BEGIN
  -- insert the immediate interaction
  -- assume it was on maxItxId
  INSERT INTO chartData
  SELECT 
    NEW.requestId,
    d.bin,
    d.count,
    c.chart
  FROM
    chartData d
    JOIN currentBrush c
      ON c.chart = d.chart
    JOIN xFilterRequest r
      ON c.pastItxId = r.itxId
      AND r.requestId = d.requestId;
  -- now query
  -- should always skip, except for the _very first_ time
  SELECT
    case
    when itxId > 4 then queryWorker(NEW.requestId, chart)
    else queryWorker(NEW.requestId, "")
    end
  FROM
    currentBrush;
    -- (SELECT 1)
    -- LEFT OUTER JOIN (
    --   select chart
    --   from currentBrush c
    --   where (c.low is not null) 
    --     and (c.selection is not null)
    -- ) b;
    -- (
    --   SELECT chart AS chart
    --   FROM currentItx
    --   -- this is going to be expensive...
    --   -- but basically skip the first interaction
    --   WHERE itxId > (SELECT MIN(itxId) FROM xBrushItx)
    --   ORDER BY itxId DESC LIMIT 1
    -- ) c
    -- the following is not needed because caching was not thought of
  -- WHERE
  --   NEW.requestId NOT IN (SELECT requestId FROM chartDataAtomic);
  -- there should be a refresh whenever anything happens...
  -- has to put it here for ordering
  -- otherwise it might be executed earlier and that would be the wrong semantics
  SELECT refreshXFilter(), log(NEW.itxId, 'render after itx');
END;