-- CREATE TEMP TABLE IF NOT EXISTS variables (vName TEXT PRIMARY KEY, vValue TEXT); 
-- might be easier to have tables on them directly...
-- mutations should not be part of application logic, but simply as an implementation aid?
CREATE TABLE currentBrushItx (itxId INTEGER, readItxId INTEGER);