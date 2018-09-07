-- this is a helper table for x-filtering
-- store the rowid and hydrate later? otherwise might be expensive...
create table charts (
  chart text
);

insert into charts values ('year'), ('month'), ('carrier'), ('delays');

-- the ORs here sort of cleverly avoids templating
CREATE VIEW filteredDataView AS
  SELECT
    f.itxId AS itxId,
    f.requestId AS requestId,
    c.chart,
    d.*
  FROM
    flights as d
    join charts as c
    JOIN xFilterRequest AS f
      ON (
        (f.yearLow  IS NULL AND f.yearHigh IS NULL)
        OR (d.year >= f.yearLow AND d.year <= f.yearHigh) 
        OR (c.chart = 'year')
      ) AND (
        (f.monthLow  IS NULL AND f.monthHigh IS NULL)
        OR (d.month >= f.monthLow AND d.month <= f.monthHigh)
        OR (chart = 'month')
      ) AND (
        (f.carrierSet IS NULL)
        OR (instr(f.carrierSet, carrier))
        OR (chart = 'carrier')
      ) AND (
        (f.arrDelayLow  IS NULL AND f.arrDelayHigh IS NULL)
        OR (d.ARR_DELAY_NEW >= f.arrDelayLow AND d.ARR_DELAY_NEW < f.arrDelayHigh)
        OR (chart = 'delays')
      ) AND (
        (f.depDelayLow  IS NULL AND f.depDelayHigh IS NULL)
        OR (d.DEP_DELAY_NEW >= f.depDelayLow AND d.DEP_DELAY_NEW < f.depDelayHigh)
        OR (chart = 'delays')
      );

CREATE VIEW yearChartDataView AS
  SELECT
    year AS bin,
    COUNT(*) AS count
  FROM filteredDataView
  where chart = 'year'
  GROUP BY year;

CREATE VIEW monthChartDataView AS
  SELECT
    month AS bin,
    COUNT(*) AS count
  FROM filteredDataView
  where chart = 'month'
  GROUP BY month;

CREATE VIEW carrierChartDataView AS
  SELECT
    carrier AS bin,
    COUNT(*) AS count
  FROM filteredDataView
  where chart = 'carrier'
  GROUP BY carrier
  order by count desc;

CREATE view delaysChartDataView AS
  SELECT ARR_DELAY_NEW, DEP_DELAY_NEW
  from filteredDataView
  where chart = 'delays';