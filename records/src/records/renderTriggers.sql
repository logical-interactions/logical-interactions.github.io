-- events that will cause rendering
-- mapInteraction: pin, and also forces brushInteractions off
-- mapInteractionsResponse
-- brushInteraction: chart, but ideally NOT map
-- brushInteractionResponse: do NOT reeval mapInteraction --- this can sort of be computed?

CREATE TRIGGER refreshAfterPinResponses AFTER INSERT ON pinResponses
  BEGIN
    SELECT log('pinResponses', 'renderMapState'), * FROM renderMapState;
    SELECT * FROM renderPinState;
    SELECT * FROM renderChartState;
    INSERT INTO renderHistory SELECT *, 'pinResponses', timeNow() FROM newMapAndBrushState;
  END;

CREATE TRIGGER refreshAfterMapRequests AFTER INSERT ON mapRequests
  BEGIN
    SELECT log('1','test');
    SELECT log('mapRequests', 'renderMapState'), * FROM renderMapState;
    SELECT * FROM renderPinState;
    SELECT * FROM renderChartState;
    SELECT * FROM pinPending;
    SELECT log('2','test');
    INSERT INTO renderHistory SELECT *, 'mapRequests', timeNow() FROM newMapAndBrushState;
  END;

CREATE TRIGGER refreshAfterBrushItxItems AFTER INSERT ON brushItxItems
  BEGIN
    SELECT * FROM renderMapState;
    SELECT * FROM renderPinState;
    SELECT * FROM renderChartState;
    SELECT * FROM chartPending;
    INSERT INTO renderHistory SELECT *, 'brushItxItems', timeNow() FROM newMapAndBrushState;
  END;

-- TODO: try the optimization this we know for sure would NOT update the map or pin state
CREATE TRIGGER refreshUserData AFTER INSERT ON userData
  BEGIN
    SELECT * FROM renderMapState;
    SELECT * FROM renderPinState;
    SELECT * FROM renderChartState;
    SELECT * FROM chartPending;
    INSERT INTO renderHistory SELECT *, 'userData', timeNow() FROM newMapAndBrushState;
  END;


