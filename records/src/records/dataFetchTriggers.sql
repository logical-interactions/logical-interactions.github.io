-- triggers are for data fetching
-- right now we can force a refresh in db on every single event

CREATE TRIGGER processNavItx AFTER INSERT ON mapInteractions
  BEGIN
    INSERT INTO mapRequests
      SELECT
        NEW.itxId AS itxId,
        timeNow() AS ts
      FROM (SELECT COALESCE(MAX(ts), 0) AS ts
      FROM mapRequests) AS m
      WHERE NEW.ts > m.ts + 100;
      -- also update the map state so that there is responsive feedback
    SELECT log(NEW.itxId || ' ' || NEW.latMin || ' ' || NEW.latMax || ' ' || NEW.longMin || ' ' || NEW.longMax, "processNavItx");
    -- SELECT setMapBounds(NEW.latMin, NEW.latMax, NEW.longMin, NEW.longMax);
  END;

CREATE TRIGGER fetchbBrushItxItems AFTER INSERT ON brushItxItems
  BEGIN
    SELECT
      queryUserData(currentBrushItx.itxId, pinData.userId)
    FROM
      currentBrushItx
      JOIN pinResponses ON currentBrushItx.readItxId = pinResponses.itxId
      JOIN pinData ON pinData.itxId = pinResponses.dataId
    WHERE 
      pinData.lat < NEW.latMax
      AND pinData.long < NEW.longMax
      AND pinData.lat > NEW.latMin
      AND pinData.long > NEW.longMin
      AND pinData.userId NOT IN (SELECT userId FROM userData);
  END;

CREATE TRIGGER processMapRequests AFTER INSERT ON mapRequests
  BEGIN
    SELECT log(NEW.itxId, "processMapRequests");
    -- check the cache, which is the pinResponses
    INSERT INTO pinResponses
      SELECT
        NEW.itxId as itxId,
        timeNow() AS ts, 
        pinResponses.itxId AS dataId
      FROM pinResponses
        JOIN (
          SELECT itx.itxId
          FROM mapInteractions AS newItx
          JOIN mapInteractions AS itx
            ON newItx.latMin = itx.latMin 
            AND newItx.latMax = itx.latMax 
            AND newItx.longMax = itx.longMax 
            AND newItx.longMin = itx.longMin
          WHERE newItx.itxId = NEW.itxId
            AND itx.itxId != NEW.itxId
          ) AS matched 
        ON pinResponses.itxId = matched.itxId;
    -- now if that insersion DIDN'T happen
    -- https://stackoverflow.com/questions/19337029/insert-if-not-exists-statement-in-sqlite this is cool
    SELECT
      queryPin(NEW.itxId, mapInteractions.latMin, mapInteractions.latMax, mapInteractions.longMin, mapInteractions.longMax)
    FROM
      mapInteractions
    WHERE
      NOT EXISTS (SELECT itxId from pinResponses WHERE itxId = NEW.itxId)
      AND mapInteractions.itxId = NEW.itxId;
    -- this is another way i think
    -- FROM (SELECT MAX(itxId) AS itxId FROM pinResponses) AS pin 
    -- JOIN (SELECT MAX(itxId) AS itxId FROM mapRequests) AS map 
    --   ON pin.itxId < map.itxId
  END;
