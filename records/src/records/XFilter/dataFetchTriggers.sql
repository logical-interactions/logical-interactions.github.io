-- see if the data is in brushRequest
-- if not, go compute
-- else, render

CREATE TRIGGER afterBrushItx AFTER INSERT ON brushItx
BEGIN
  -- TOOD: add throttling
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
  SELECT
    queryWorker(NEW.requestId)
  WHERE
    NEW.requestId NOT IN (SELECT dataId FROM xFilterResponse);
END;