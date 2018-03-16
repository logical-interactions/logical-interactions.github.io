-- see if the data is in brushRequest
-- if not, go compute
-- else, render

CREATE TRIGGER afterBrushItx AFTER INSERT ON xBrushItx
BEGIN
  -- TOOD: add throttling
  SELECT log(NEW.itxId || NEW.chart || NEW.low || ' - ' || NEW.high, 'afterBrushItx');
  INSERT INTO xFilterRequest (itxId, ts, hourLow, hourHigh, delayLow, delayHigh, distanceLow, distanceHigh)
  SELECT
    id.itxId,
    timeNow(),
    hour.low,
    hour.high,
    delay.low,
    delay.high,
    distance.low,
    distance.high
  FROM
    (SELECT MAX(itxId) AS itxId FROM currentItx) AS id,
    (
      SELECT
        low,
        high
      FROM
        currentItx
      WHERE chart = 'hour'
    ) AS hour,
    (
      SELECT
        low,
        high
      FROM
        currentItx
      WHERE chart = 'delay'
    ) AS delay,
    (
      SELECT
        low,
        high
      FROM
        currentItx
      WHERE chart = 'distance'
    ) AS distance;
END;

CREATE TRIGGER afterBrushRequestItx AFTER INSERT ON xFilterRequest
BEGIN
  -- send request to worker if response is not present
  INSERT INTO xFilterResponse (requestId, ts, dataId)
  SELECT
    NEW.requestId,
    timeNow(),
    xFilterRequest.requestId
  FROM xFilterRequest
  WHERE
    xFilterRequest.requestId != NEW.requestId
    AND hourLow = NEW.hourLow AND hourHigh = NEW.hourHigh
    AND delayLow = NEW.delayLow AND delayHigh = NEW.delayHigh
    AND distanceLow = NEW.distanceLow AND distanceHigh = NEW.distanceHigh;
  -- also insert the immediate interaction
  -- assume it was on maxItxId
  INSERT INTO chartData
  SELECT 
    NEW.requestId,
    d.bin,
    d.count,
    c.chart
  FROM
    chartData d
    JOIN (
        SELECT chart, low, high FROM currentItx ORDER BY itxId DESC LIMIT 1
      ) c ON c.chart = d.chart
    JOIN (SELECT MAX(itxId) itxId FROM xFilterRender) render
    JOIN xFilterRequest r ON
      render.itxId = r.itxId 
      AND r.requestId = d.requestId
  WHERE d.bin < c.high AND d.bin > c.low;
  -- now query
  SELECT
    queryWorker(NEW.requestId, COALESCE(c.chart, ""))
  FROM
    (SELECT 1)
    LEFT OUTER JOIN (
      SELECT chart AS chart
      FROM currentItx
      -- this is goign to be expensive...
      -- but basically skip the first interaction
      WHERE ts > (SELECT MIN(ts) FROM xBrushItx)
      ORDER BY itxId DESC LIMIT 1) c
  WHERE
    NEW.requestId NOT IN (SELECT dataId FROM xFilterResponse);
END;