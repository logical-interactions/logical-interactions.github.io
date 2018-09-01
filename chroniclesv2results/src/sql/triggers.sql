create trigger afterWIdQId after insert on taskSelectionInput
begin
  select tick(), log(new.wId || ', ' || new.qId, 'taskSelectionInput');
end;