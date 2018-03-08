-- inerted into filterHistory
CREATE VIEW currentItx AS
  SELECT
    o.*
  FROM brushItx o
    LEFT JOIN brushItx b
        ON o.chart = b.chart AND o.ts < b.ts
  WHERE b.ts is NULL;
  -- SELECT
  --   chart,
  --   MAX(itxId) AS itxId
  -- FROM
  --   brushItx
  -- GROUP BY chart;
