-- if there is an interaction, we do the trigger for request if there is some threshold

-- also grid this so that it snaps to position

CREATE TRIGGER processMapInteractions AFTER INSERT ON mapInteractions
  BEGIN
    INSERT INTO mapRequests
      SELECT
        NEW.itxId AS itxId,
        timeNow() AS ts
      FROM (SELECT MAX(ts) AS ts
      FROM mapRequests) AS m
      WHERE NEW.ts > m.ts + 100;
      -- also update the map state so that there is responsive feedback
    SELECT log(NEW.itxId || ' ' || NEW.latMin || ' ' || NEW.latMax || ' ' || NEW.longMin || ' ' || NEW.longMax, "processMapInteractions");
    SELECT setMapBounds(NEW.itxId, NEW.latMin, NEW.latMax, NEW.longMin, NEW.longMax);
  END;

-- we trigger the request
CREATE TRIGGER processMapRequests AFTER INSERT ON mapRequests
  BEGIN
    -- check the cache, which is the pinResponses
    INSERT INTO pinResponses
      SELECT
        NEW.itxId as itxId,
        timeNow() AS ts, 
        pinResponses.dataId AS dataId
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

-- now update the states
CREATE TRIGGER updateMapState AFTER INSERT ON pinResponses
  BEGIN
    -- all this because we don't have aggregate...
    SELECT resetMapStateTemp();
    SELECT setMapStateTemp(NEW.itxId, long, lat)
    FROM pinData
    WHERE pinData.dataId = NEW.dataId;
    -- fun, funcs can be composed!
    SELECT setMapState(NEW.itxId, getMapStateValue());
  END;

-- think about how we can do even smarter partial edits
-- https://bl.ocks.org/mbostock/3783604
-- though d3 seems to have done verything already --- can we just shift the canvas left and do thing?

-- all the triggers are at the data processing level

-- if someone needs complex processing, call UDFs, won't be diff from rx