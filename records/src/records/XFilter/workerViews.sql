-- TODO: reference data.sql file in RUIO
CREATE VIEW hourChartDataView AS
  SELECT
    hour AS bin,
    COUNT(*) AS count
  FROM filteredDataView
  GROUP BY hour;

CREATE VIEW delayChartDataView AS
  SELECT
    delay AS bin,
    COUNT(*) AS count
  FROM filteredDataView
  GROUP BY delay;

CREATE VIEW distanceChartDataView AS
  SELECT
    distance AS bin,
    COUNT(*) AS count
  FROM filteredDataView
  GROUP BY distance;

-- needs some basic templating here perhaps?
CREATE VIEW filteredDataView AS
  SELECT
    f.itxId AS itxId,
    f.requestId AS requestId,
    binnedData.*
  FROM
    binnedData
    JOIN xFilterRequest AS f
      ON ((f.hourLow  IS NULL AND f.hourHigh IS NULL)
         OR (binnedData.hour >= f.hourLow  AND binnedData.hour <= f.hourHigh))
      AND ((f.delayLow  IS NULL AND f.delayHigh IS NULL)
         OR (binnedData.delay >= f.delayLow  AND binnedData.delay <= f.delayHigh))
      AND ((f.distanceLow  IS NULL AND f.distanceHigh IS NULL)
         OR (binnedData.distance >= f.distanceLow  AND binnedData.distance <= f.distanceHigh))