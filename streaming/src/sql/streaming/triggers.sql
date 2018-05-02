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

