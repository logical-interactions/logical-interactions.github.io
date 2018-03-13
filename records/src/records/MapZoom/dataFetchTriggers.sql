-- triggers are for data fetching
-- right now we can force a refresh in db on every single event

CREATE TRIGGER processNavItx AFTER INSERT ON mapItx
  BEGIN
    INSERT INTO mapCurrentItxId
      SELECT
        NEW.itxId AS itxId,
        timeNow() AS ts
      FROM (
        SELECT COALESCE(MAX(ts), 0) AS ts
        FROM mapCurrentItxId
      ) AS m
      WHERE NEW.ts > m.ts + 100;
      -- also update the map state so that there is responsive feedback
    SELECT log(NEW.itxId || ' ' || NEW.latMin || ' ' || NEW.latMax || ' ' || NEW.longMin || ' ' || NEW.longMax, "processNavItx");
    -- SELECT setMapBounds(NEW.latMin, NEW.latMax, NEW.longMin, NEW.longMax);
  END;

CREATE TRIGGER fetchUserData AFTER INSERT ON userDataRequest
  BEGIN
    SELECT queryUserData(NEW.userId);
  END;  

CREATE TRIGGER fetchUserDataFromBrush AFTER INSERT ON brushItxItems
  BEGIN
    INSERT INTO userDataRequest
    SELECT
      pinData.userId AS userId,
      timeNow()
    FROM
      pinData
    WHERE
      pinData.userId NOT IN (SELECT userId FROM userDataRequest)
      AND pinData.lat < NEW.latMax
      AND pinData.long < NEW.longMax
      AND pinData.lat > NEW.latMin
      AND pinData.long > NEW.longMin;
  END;

CREATE TRIGGER fetchUserDataFromStream AFTER INSERT ON pinStreamingInstance
  BEGIN
    INSERT INTO userDataRequest
    SELECT
      pinData.userId AS userId,
      timeNow()
    FROM
      pinData
      JOIN currentBrush b ON 
        pinData.lat < b.brushLatMax
        AND pinData.long < b.brushLongMax
        AND pinData.lat > b.brushLatMin
        AND pinData.long > b.brushLongMin
    WHERE
      pinData.userId NOT IN (SELECT userId FROM userDataRequest);
  END;

CREATE TRIGGER processMapState AFTER INSERT ON mapCurrentItxId
  BEGIN
    SELECT log(NEW.itxId, "processMapState");
    -- check the cache, which is the pinResponses
    INSERT INTO pinResponses
      SELECT
        NEW.itxId as itxId,
        timeNow() AS ts
      FROM pinResponses
        JOIN (
          SELECT itx.itxId
          FROM
            mapItx AS newItx
            JOIN mapItx AS itx
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
    SELECT log(itxId, 'pinResponses cached') from pinResponses WHERE itxId = NEW.itxId;
    SELECT
      queryPin(NEW.itxId, m.latMin, m.latMax, m.longMin, m.longMax)
    FROM
      mapItx m
    WHERE
      NOT EXISTS (SELECT itxId from pinResponses WHERE itxId = NEW.itxId)
      AND m.itxId = NEW.itxId;
  END;
