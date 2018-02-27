

CREATE TRIGGER brushItxMapState AFTER INSERT ON brushItx
  BEGIN
    UPDATE brushItx
      SET mapItxId = (SELECT mapItxId FROM renderHistory ORDER BY ts LIMIT 1)
      WHERE brushItx.ts = NEW.ts;
  END;

CREATE TRIGGER processbBrushItxItems AFTER INSERT ON brushItxItems
  BEGIN
    UPDATE brushItxItems
      SET itxId = (SELECT itxId FROM currentBrushItx)
      WHERE
        brushItxItems.ts = NEW.ts;
  END;