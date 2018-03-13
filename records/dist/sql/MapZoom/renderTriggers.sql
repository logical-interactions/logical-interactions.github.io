-- events that will cause rendering
-- mapInteraction: pin, and also forces brushInteractions off
-- brushInteraction: chart, but ideally NOT map
-- brushInteractionResponse: do NOT reeval mapInteraction --- this can sort of be computed?

CREATE TRIGGER refreshAfterPinResponses AFTER INSERT ON pinResponses
  BEGIN
    INSERT INTO renderItxs
    SELECT mapItxId, brushItxId, 'pinResponses', timeNow()
    FROM renderItxsView;
  END;

CREATE TRIGGER refreshAfterMapItx AFTER INSERT ON mapCurrentItxId
  BEGIN
    INSERT INTO renderItxs
    SELECT mapItxId, brushItxId, 'mapState', timeNow()
    FROM renderItxsView;
  END;

CREATE TRIGGER refreshAfterBrushItxItems AFTER INSERT ON brushItxItems
  BEGIN
    INSERT INTO renderItxs
    SELECT mapItxId, brushItxId, 'brushItxItems', timeNow()
    FROM renderItxsView;
  END;

-- TODO: try the optimization this we know for sure would NOT update the map or pin state
CREATE TRIGGER refreshUserData AFTER INSERT ON userData
  BEGIN
    INSERT INTO renderItxs
    SELECT mapItxId, brushItxId, 'userData', timeNow()
    FROM renderItxsView;
  END;

CREATE TRIGGER refreshPinStreamingInstance AFTER INSERT ON pinStreamingInstance
  BEGIN
    INSERT INTO renderItxs
    SELECT mapItxId, brushItxId, 'pinStreamingInstance', timeNow()
    FROM renderItxsView;
  END;

-- here is a place where we could do program analysis
-- e.g. when it's just brush ItxItems, we just need the brush and the chart
CREATE TRIGGER refreshUI AFTER INSERT ON renderItxs
  BEGIN
    SELECT
      setMapState(latMin, latMax, longMin, longMax),
      setMapBounds(latMin, latMax, longMin, longMax)
    FROM mapState
    WHERE NEW.cause != 'brushItxItems';
    
    SELECT
      setPinState(latMin,latMax,longMin,longMax,long,lat)
    FROM pinState
    WHERE NEW.cause != 'brushItxItems';
    
    SELECT
      setMapPending(pending)
    FROM pinPendingState;
    
    SELECT
      setChartDataState(Q1, Q2, Q3, Q4)
    FROM chartState;
    
    SELECT
      setChartPending(leftUserIdCount)
    FROM chartPendingState;
    
    SELECT
      setBrushState(mapLatMax, mapLongMax, mapLatMin, mapLongMin, brushLatMax, brushLongMax, brushLatMin, brushLongMin)
    FROM currentBrush;
  END;