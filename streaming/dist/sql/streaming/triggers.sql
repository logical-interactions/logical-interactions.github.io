create trigger itxTrigger after insert on itx
begin
  insert into itx (ts, low, high, itxType)
  select 
    timeNow(),
    (NEW.high - NEW.low) * b.relativeLow + NEW.low,
    (NEW.high - NEW.low) * b.relativeHigh + NEW.low,
    'reactiveBrush'
  from 
    currentUserBrush b
  where 
    b.itxFixType = 'scale'
    and NEW.itxType = 'window';
  select refreshAllCharts();
end;

-- TODO: create a trigger that checks that the user brush must be within bounds

create trigger dataTrigger after insert on events
begin
  insert into itx (ts, low, high, itxType)
  select 
    timeNow(),
    (c.high - c.low) * b.relativeLow + c.low,
    (c.high - c.low) * b.relativeHigh + c.low,
    'reactiveBrush'
  from 
    currentUserBrush b,
    currentWindow c
  where 
    b.itxFixType = 'scale';
  select refreshAllCharts();
end;

create trigger userDataTrigger after insert on user
begin
  select refreshAllCharts();
end;