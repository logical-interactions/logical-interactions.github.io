create table taskSelectionInput (
  ts integer not null,
  wId text not null,
  qId text not null
  -- unique(wId, qId)
);
