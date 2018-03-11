CREATE VIEW brushOnlyState AS
  SELECT 
    brushItxItems.itxId,
    brushItx.mapItxId,
    brushItxItems.ts,
    brushItxItems.latMin,
    brushItxItems.latMax,
    brushItxItems.longMin,
    brushItxItems.longMax
  FROM
    brushItxItems
    JOIN brushItx ON brushItx.itxId = brushItxItems.itxId,
    mapOnlyState
  WHERE
    brushItx.ts > mapOnlyState.ts
  ORDER BY brushItxItems.ts DESC LIMIT 1;

CREATE VIEW mapOnlyState AS
  SELECT
    mapInteractions.itxId,
    mapInteractions.ts
  FROM mapInteractions
  -- ORDER BY 
    -- itxId DESC LIMIT 1;
    JOIN pinResponses ON pinResponses.itxId = mapInteractions.itxId
    ORDER BY pinResponses.itxId DESC LIMIT 1;


-- if brush is earlier than the most recent map state, use everything based on brush
-- if map is earliest, remove brush (we can also redraw)

CREATE VIEW newMapAndBrushState AS
   SELECT
    COALESCE(brushOnlyState.mapItxId, mapOnlyState.itxId) AS mapItxId,
    brushOnlyState.itxId AS brushItxId
   FROM
    mapOnlyState
    LEFT OUTER JOIN brushOnlyState;


CREATE VIEW pinPending AS
  SELECT setMapPending(val.pending)
  FROM (
    SELECT COALESCE(pinResponses.itxId, 0) AS pending
    FROM newMapAndBrushState AS s
      LEFT OUTER JOIN pinResponses ON pinResponses.itxId = s.mapItxId
  ) AS val;


CREATE VIEW renderMapState AS
  SELECT
    log('start', 'renderMapState'),
    setMapState(m.latMin, m.latMax, m.longMin, m.longMax),
    setMapBounds(m.latMin, m.latMax, m.longMin, m.longMax)
  FROM
    newMapAndBrushState AS s
    INNER JOIN mapInteractions AS m ON s.mapItxId = m.itxId;
    -- -- don't render if the map state hasn't changed
    -- (
    --   SELECT COALESCE(mapItxId, -1) AS mapItxId
    --   FROM renderHistory
    --   WHERE cause = 'mapRequests'
    --   ORDER BY ts DESC LIMIT 1
    -- ) AS r
    -- WHERE r.mapItxId != s.mapItxId;

CREATE VIEW renderPinState AS
  SELECT setPinState(m.latMin, m.latMax, m.longMin, m.longMax, pinData.long, pinData.lat)
  FROM
    newMapAndBrushState AS s
    JOIN mapInteractions AS m ON s.mapItxId = m.itxid
    JOIN pinData ON 
      pinData.lat < m.latMax
      AND pinData.long < m.longMax
      AND pinData.lat > m.latMin
      AND pinData.long > m.longMin;
    -- don't render again if the mapItx hasn't changed and there has been a render based on the mapItx
    -- (
    --   SELECT mapItxId AS mapItxId
    --   FROM renderHistory
    --   WHERE cause = 'pinResponses'
    --   ORDER BY ts DESC LIMIT 1
    -- ) AS r
    -- WHERE r.mapItxId != s.mapItxId;


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

CREATE VIEW chartPending AS
  SELECT
    -- if the count is greater than 0, it's still pending
    setChartPending(COUNT(userId))
  FROM
    chartUserIds
  WHERE userId NOT IN (SELECT userId FROM userData);

CREATE VIEW renderBrushState AS
  SELECT
    setBrushState(m.latMax, m.longMax, m.latMin, m.longMin, b.latMax, b.longMax, b.latMin, b.longMin)
  FROM
    newMapAndBrushState AS s
    JOIN mapInteractions AS m ON s.mapItxId = m.itxId
    JOIN brushItxItems AS b ON s.brushItxId = b.itxId
    JOIN (
        SELECT MAX(ts) AS ts
        FROM
          brushItxItems AS b2
          JOIN newMapAndBrushState AS s2 ON b2.itxId = s2.brushItxId
      ) AS t
      ON b.ts = t.ts;

-- assuming that the auto increment starts at 1, this boolean business is fine.
CREATE VIEW renderChartState AS
  SELECT
    setChartDataState(AVG(userData.Q1), AVG(userData.Q2), AVG(userData.Q3), AVG(userData.Q4))
  FROM
    chartUserIds
    JOIN userData ON userData.userId = chartUserIds.userId,
    (SELECT MAX(ts) as ts FROM renderHistory) AS r;
  -- WHERE
  --   timeNow() - r.ts > 300;