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
    JOIN pinResponses ON pinResponses.itxId = mapInteractions.itxId
    ORDER BY pinResponses.itxId
    LIMIT 1;


-- if brush is earlier than the most recent map state, use everything based on brush
-- if map is earliest, remove brush (we can also redraw)

CREATE VIEW newMapAndBrushState AS
   SELECT
    COALESCE(brushOnlyState.mapItxId, mapOnlyState.itxId) AS mapItxId,
    brushOnlyState.itxId AS brushItxId
   FROM
    mapOnlyState
    LEFT OUTER JOIN brushOnlyState;

CREATE VIEW renderMapState AS
  SELECT
    log('start', 'renderMapState'),
    setMapState(m.latMin, m.latMax, m.longMin, m.longMax),
    setMapBounds(m.latMin, m.latMax, m.longMin, m.longMax)
  FROM
    newMapAndBrushState
    JOIN mapInteractions AS m ON itxid;

CREATE VIEW renderPinState AS
  SELECT setPinState(m.latMin, m.latMax, m.longMin, m.longMax, pinData.long, pinData.lat)
  FROM newMapAndBrushState AS s
    JOIN pinResponses ON pinResponses.itxId = s.mapItxId
    JOIN pinData ON pinData.itxId = pinResponses.dataId
    JOIN mapInteractions AS m ON s.mapItxId = m.itxid;

-- assuming that the auto increment starts at 1, this boolean business is fine.
CREATE VIEW renderChartState AS
  SELECT
    setChartDataState(AVG(userData.Q1), AVG(userData.Q2), AVG(userData.Q3), AVG(userData.Q4), COALESCE(s.brushItxId, 0))
  FROM
    newMapAndBrushState AS s
    JOIN mapInteractions AS m ON s.mapItxId = m.itxId
    JOIN pinData ON pinData.itxId = s.mapItxId
    JOIN userData ON userData.userId = pinData.userId
    WHERE
      pinData.lat < m.latMax
      AND pinData.long < m.longMax
      AND pinData.lat > m.latMin
      AND pinData.long > m.longMin;