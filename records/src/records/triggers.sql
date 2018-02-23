-- if there is an interaction, we do the trigger for request if there is some threshold

-- also grid this so that it snaps to position

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
    SELECT setMapBounds(NEW.latMin, NEW.latMax, NEW.longMin, NEW.longMax);
  END;

CREATE TRIGGER processBrushItx AFTER INSERT ON brushItx
  -- now we need to start listening on the countries
  BEGIN
    INSERT INTO mapRequests
      SELECT
        NEW.itxId AS itxId,
        timeNow() AS ts
      FROM (SELECT COALESCE(MAX(ts), 0) AS ts
      FROM mapRequests) AS m
      WHERE NEW.ts > m.ts + 100;
      -- also update the map state so that there is responsive feedback
    SELECT log(NEW.itxId || ' ' || NEW.latMin || ' ' || NEW.latMax || ' ' || NEW.longMin || ' ' || NEW.longMax, "processBrushItx");
    UPDATE currentBrushItx SET itxId = NEW.itxId;
    SELECT drawBrush(NEW.latMin, NEW.latMax, NEW.longMin, NEW.longMax);
  END;

-- not sure if this works, needs debuggin'
CREATE TRIGGER processbBrushItxItems AFTER INSERT ON brushItxItems
  BEGIN
    UPDATE brushItxItems
      SET brushItxItems.itxId = currentBrushItx.itxId
      WHERE 
        brushItxItems.ts = NEW.ts 
        AND brushItxItems.country = NEW.country
    -- see if the result is cached
    -- render immediately if it is
    -- calculate all the countries matching so far and update chart
    SELECT AVG(Q1), AVG(Q2), AVG(Q3), AVG(Q4)
    FROM countryData
    JOIN brushItxItems ON countryData.country = brushItxItems.country
    WHERE brushItxItems.itxId = currentBrushItx.itxId;
    -- if not
    SELECT getBrushData(brushItx.itxId, NEW.country)
    FROM brushItx
    JOIN currentBrushItx ON 
      brushItx.itxId = currentBrushItx.itxId
    WHERE NEW.country NOT IN (
      SELECT country FROM countryData
    );
  END;

-- we trigger the request
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
    SELECT queryPin(NEW.itxId, mapInteractions.latMin, mapInteractions.latMax, mapInteractions.longMin, mapInteractions.longMax)
    FROM mapInteractions
    WHERE
      NOT EXISTS (SELECT itxId from pinResponses WHERE itxId = NEW.itxId)
      AND mapInteractions.itxId = NEW.itxId;
    -- this is another way i think
    -- FROM (SELECT MAX(itxId) AS itxId FROM pinResponses) AS pin 
    -- JOIN (SELECT MAX(itxId) AS itxId FROM mapRequests) AS map 
    --   ON pin.itxId < map.itxId
  END;

CREATE TRIGGER updateMapState AFTER INSERT ON pinResponses
  BEGIN
    -- TODO: resolve logic
    SELECT resetMapStateTemp(latMin, latMax, longMin, longMax)
    FROM mapInteractions
    ORDER BY itxId DESC LIMIT 1;
    SELECT setMapStateTemp(long, lat)
    FROM pinData
    WHERE pinData.itxId = COALESCE(NEW.dataId, NEW.itxId);
    -- fun, funcs can be composed!
    SELECT getMapStateValue();
  END;

-- think about how we can do even smarter partial edits
-- https://bl.ocks.org/mbostock/3783604
-- though d3 seems to have done verything already --- can we just shift the canvas left and do thing?

-- all the triggers are at the data processing level

-- if someone needs complex processing, call UDFs, won't be diff from rx