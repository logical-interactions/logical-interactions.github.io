-- this trigger is used to maintain the mutation
CREATE TRIGGER processBrushItx AFTER INSERT ON brushItx
  BEGIN
    -- UPDATE 
    INSERT OR REPLACE INTO currentBrushItx
    SELECT
      1,
      NEW.itxId,
      mapItxId,
      0
    FROM renderHistory;
  END;

-- CREATE TEMP TABLE IF NOT EXISTS variables (vName TEXT PRIMARY KEY, vValue TEXT); 
-- might be easier to have tables on them directly...
-- mutations should not be part of application logic, but simply as an implementation aid?
CREATE TABLE currentBrushItx (
  fix PRIMARY KEY,
  itxId INTEGER NOT NULL,
  readItxId INTEGER NOT NULL,
  done BOOLEAN NOT NULL
);