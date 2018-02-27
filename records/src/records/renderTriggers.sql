-- events that will cause rendering
-- mapInteraction: pin, and also forces brushInteractions off
-- mapInteractionsResponse
-- brushInteraction: chart, but ideally NOT map
-- brushInteractionResponse: do NOT reeval mapInteraction --- this can sort of be computed?

CREATE TRIGGER refreshAfterPinResponses AFTER INSERT ON pinResponses
  BEGIN
    INSERT INTO renderHistory SELECT *, 'pinResponses', timeNow() FROM newMapAndBrushState;
    SELECT * FROM renderMapState;
    SELECT * FROM renderPinState;
    SELECT * FROM renderChartState;
  END;

CREATE TRIGGER refreshAfterMapRequests AFTER INSERT ON mapRequests
  BEGIN
    INSERT INTO renderHistory SELECT *, 'mapRequests', timeNow() FROM newMapAndBrushState;
    SELECT * FROM renderMapState;
    SELECT * FROM renderPinState;
    SELECT * FROM renderChartState;
  END;

CREATE TRIGGER refreshAfterBrushItxItems AFTER INSERT ON brushItxItems
  BEGIN
    INSERT INTO renderHistory SELECT *, 'brushItxItems', timeNow() FROM newMapAndBrushState;
    SELECT * FROM renderMapState;
    SELECT * FROM renderPinState;
    SELECT * FROM renderChartState;
  END;

-- TODO: try the optimization this we know for sure would NOT update the map or pin state
CREATE TRIGGER refreshUserData AFTER INSERT ON userData
  BEGIN
    INSERT INTO renderHistory SELECT *, 'userData', timeNow() FROM newMapAndBrushState;
    SELECT * FROM renderMapState;
    SELECT * FROM renderPinState;
    SELECT * FROM renderChartState;
  END;


