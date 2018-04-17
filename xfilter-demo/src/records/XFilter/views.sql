-- inerted into filterHistory
CREATE VIEW currentItx AS
  SELECT
    o.*
  FROM xBrushItx o
    LEFT JOIN xBrushItx b
        ON o.chart = b.chart AND o.ts < b.ts
  WHERE b.ts is NULL;
  -- SELECT
  --   chart,
  --   MAX(itxId) AS itxId
  -- FROM
  --   xBrushItx
  -- GROUP BY chart;
