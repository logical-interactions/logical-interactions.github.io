-- events that will cause rendering
-- mapInteraction: pin, and also forces brushInteractions off
-- mapInteractionsResponse
-- brushInteraction: chart, but ideally NOT map
-- brushInteractionResponse: do NOT reeval mapInteraction --- this can sort of be computed?

CREATE TRIGGER refreshAfterPinResponses AFTER INSERT ON pinResponses
  BEGIN
    INSERT INTO renderItxs
    SELECT mapItxId, brushItxId, 'pinResponses', timeNow()
    FROM renderItxsView;
  END;

CREATE TRIGGER refreshAfterMapRequests AFTER INSERT ON mapRequests
  BEGIN
    INSERT INTO renderItxs
    SELECT mapItxId, brushItxId, 'mapRequests', timeNow()
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

CREATE TRIGGER refreshStreamingData AFTER INSERT ON streamingData
  BEGIN
    INSERT INTO renderItxs
    SELECT mapItxId, brushItxId, 'streamingData', timeNow()
    FROM renderItxsView;
  END;

-- here is a place where we could do program analysis
-- e.g. when it's just brush ItxItems, we just need the brush and the chart
CREATE TRIGGER refreshUI AFTER INSERT ON renderItxs
  BEGIN
    SELECT * FROM renderMapState WHERE NEW.cause != 'brushItxItems';
    SELECT * FROM renderPinState WHERE NEW.cause != 'brushItxItems';
    SELECT * FROM pinPending;
    SELECT * FROM renderChartState;
    SELECT * FROM chartPending;
    SELECT setBrushState(mapLatMax, mapLongMax, mapLatMin, mapLongMin, brushLatMax, brushLongMax, brushLatMin, brushLongMin) FROM currentBrush;
  END;