-- TODO: reference data.sql file in RUIO
CREATE VIEW hourChartDataView AS
  SELECT
    hour AS bin,
    COUNT(*) AS count
  FROM filteredDataView
  GROUP BY hour;

CREATE VIEW delayChartDataView AS
  SELECT
    delayBin AS bin,
    COUNT(*) AS count
  FROM filteredDataView
  GROUP BY delayBin;

CREATE VIEW distanceChartDataView AS
  SELECT
    disntanceBin AS bin,
    COUNT(*) AS count
  FROM filteredDataView
  GROUP BY disntanceBin;

-- needs some basic templating here perhaps?
CREATE VIEW filteredDataView AS
  SELECT
    binnedData
    JOIN (
      SELECT
        itxId,
        b.low,
        b.high
      FROM
        currentItx b
      WHERE chart = 'hour'
    ) AS hourItx ON
      (hourItx.low  IS NULL AND hourItx.high IS NULL)
      OR (binnedData.hour >= hourItx.low AND binnedData.hour <= hourItx.high)
    JOIN (
      SELECT
        itxId,
        b.low,
        b.high
      FROM
        currentItx b
      WHERE chart = 'delay'
    ) AS delayItx ON
      (delayItx.low  IS NULL AND delayItx.high IS NULL)
      OR (binnedData.delay >= delayItx.low AND binnedData.delay <= delayItx.high)
    JOIN (
      SELECT
        itxId,
        b.low,
        b.high
      FROM
        currentItx b
      WHERE chart = 'distance'
    ) AS distanceItx ON
      (distanceItx.low  IS NULL AND distanceItx.high IS NULL)
      OR (binnedData.distance >= distanceItx.low AND binnedData.distance <= distanceItx.high)
  ;