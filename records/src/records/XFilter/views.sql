-- TODO: reference data.sql file in RUIO
CREATE VIEW hourChartData AS
   SELECT
    getHour(date) AS val,
    COUNT(*) AS count,
    'hour' AS chart,
    data_bins.lt AS lt
  FROM data_bins
  GROUP BY hour;