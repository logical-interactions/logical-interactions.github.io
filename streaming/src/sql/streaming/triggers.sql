-- listen to interaction event / new window
create trigger itxTrigger after insert on itx
begin
  -- update the charts
  select refreshAllCharts();
end;

