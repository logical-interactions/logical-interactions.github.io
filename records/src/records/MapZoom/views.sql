
CREATE VIEW mapOnlyStateNoneBlocking AS
  SELECT
    mapItx.itxId,
    mapItx.ts
  FROM mapItx
  ORDER BY itxId DESC LIMIT 1;

CREATE VIEW mapOnlyStateBlocking AS
  SELECT
    mapItx.itxId,
    mapItx.ts
  FROM mapItx
    JOIN pinResponses p ON p.itxId = mapItx.itxId
    ORDER BY p.itxId DESC LIMIT 1;

CREATE VIEW brushOnlyState AS
  SELECT 
    b.itxId,
    brushItx.mapItxId,
    b.ts,
    b.latMin,
    b.latMax,
    b.longMin,
    b.longMax
  FROM
    brushItxItems b
    JOIN brushItx ON brushItx.itxId = b.itxId,
    mapOnlyStateNoneBlocking m
  WHERE
    brushItx.ts > m.ts
  ORDER BY b.ts DESC LIMIT 1;

-- if brush is earlier than the most recent map state, use everything based on brush
-- if map is earliest, remove brush (we can also redraw)

CREATE VIEW renderItxsView AS
  SELECT
    COALESCE(brushOnlyState.mapItxId, m.itxId) AS mapItxId,
    brushOnlyState.itxId AS brushItxId
  FROM
    mapOnlyStateNoneBlocking m
    LEFT OUTER JOIN brushOnlyState;

CREATE VIEW newMapAndBrushState AS
  SELECT
    mapItxId,
    brushItxId
  FROM
    renderItxs ORDER by ts DESC LIMIT 1;

CREATE VIEW pinPendingState AS
  SELECT val.pending
  FROM (
    SELECT COALESCE(pinResponses.itxId, 0) AS pending
    FROM newMapAndBrushState AS s
      LEFT OUTER JOIN pinResponses ON pinResponses.itxId = s.mapItxId
  ) AS val;


CREATE VIEW mapState AS
  SELECT
    m.latMin,
    m.latMax,
    m.longMin,
    m.longMax
  FROM
    newMapAndBrushState AS s
    INNER JOIN mapItx AS m ON s.mapItxId = m.itxId;

CREATE VIEW pinState AS
  SELECT
    m.latMin,
    m.latMax,
    m.longMin,
    m.longMax,
    pinData.long,
    pinData.lat
  FROM
    newMapAndBrushState AS s
    JOIN mapItx AS m ON s.mapItxId = m.itxid
    JOIN pinData ON 
      pinData.lat < m.latMax
      AND pinData.long < m.longMax
      AND pinData.lat > m.latMin
      AND pinData.long > m.longMin;


-- helper view
CREATE VIEW chartUserIds AS
  SELECT
    pinData.userId AS userId
  FROM
    newMapAndBrushState AS s
    JOIN brushItxItems AS b ON s.brushItxId = b.itxId
    JOIN (
        SELECT MAX(ts) AS ts
        FROM
          brushItxItems AS b2
          JOIN newMapAndBrushState AS s2 ON b2.itxId = s2.brushItxId
      ) AS t
      ON b.ts = t.ts
    JOIN pinData
      ON pinData.lat < b.latMax
      AND pinData.long < b.longMax
      AND pinData.lat > b.latMin
      AND pinData.long > b.longMin;

CREATE VIEW chartPendingState AS
  SELECT
    -- if the count is greater than 0, it's still pending
    COUNT(userId) AS leftUserIdCount
  FROM
    chartUserIds
  WHERE userId NOT IN (SELECT userId FROM userData);



CREATE VIEW currentBrush AS
  SELECT
    m.latMax mapLatMax,
    m.longMax mapLongMax,
    m.latMin mapLatMin,
    m.longMin mapLongMin,
    b.latMax brushLatMax,
    b.longMax brushLongMax,
    b.latMin brushLatMin,
    b.longMin brushLongMin
  FROM
    newMapAndBrushState AS s
    JOIN mapItx AS m ON s.mapItxId = m.itxId
    JOIN brushItxItems AS b ON s.brushItxId = b.itxId
    JOIN (
        SELECT MAX(ts) AS ts
        FROM
          brushItxItems AS b2
          JOIN newMapAndBrushState AS s2 ON b2.itxId = s2.brushItxId
      ) AS t
      ON b.ts = t.ts;

CREATE VIEW getAllBrushState AS
  SELECT DISTINCT
    m.latMax mapLatMax,
    m.longMax mapLongMax,
    m.latMin mapLatMin,
    m.longMin mapLongMin,
    b.latMax brushLatMax,
    b.longMax brushLongMax,
    b.latMin brushLatMin,
    b.longMin brushLongMin
  FROM
    renderItxs s
    JOIN mapItx AS m ON s.mapItxId = m.itxId
    JOIN brushItxItems AS b ON s.brushItxId = b.itxId
    WHERE b.ts = (
        SELECT MAX(ts) AS ts
        FROM
          brushItxItems AS b2
          WHERE b2.itxId = s.brushItxId
      );

-- assuming that the auto increment starts at 1, this boolean business is fine.
CREATE VIEW chartState AS
  SELECT
    AVG(userData.Q1) Q1,
    AVG(userData.Q2) Q2,
    AVG(userData.Q3) Q3, 
    AVG(userData.Q4) Q4
  FROM
    chartUserIds
    JOIN userData ON userData.userId = chartUserIds.userId,
    (SELECT MAX(ts) as ts FROM renderItxs) AS r;
  -- WHERE
  --   timeNow() - r.ts > 300;