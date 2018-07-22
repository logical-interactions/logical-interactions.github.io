CREATE TRIGGER xFilterRenderTriggerResponse AFTER INSERT ON chartDataAtomic
BEGIN
  SELECT refreshXFilter(), log(r.itxId, 'render after response')
  from xFilterRequest r where r.requestId = NEW.requestId;
END;

-- CREATE TRIGGER xFilterPending AFTER INSERT ON xFilterRequest
-- WHEN NEW.itxId IS NOT NULL
-- BEGIN
--   -- sending pending to true
--   SELECT
--     setXFilterPending(1),
--     log(NEW.requestId, 'xFilterPending');
-- END;