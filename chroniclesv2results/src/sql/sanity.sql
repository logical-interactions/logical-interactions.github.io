-- the purpose of this file is to have the views insert here and check against the constraints
-- the triggers will do the insertion and removal
-- this should be fairly stand alone and just need to be ran on the side
-- only thing is that this needs to be maintained for consistency between here and the views
-- odd pattern but should be ok

create table brushItxInTaskSelectionTest (
  itxStart integer not null,
  itxEnd integer not null check (itxEnd >= itxStart),
  itxId integer not null,
  unique(itxStart)
);

-- no ordering requirement so could be separate
create trigger sanity after insert on taskSelectionInput
begin
  delete from brushItxInTaskSelectionTest;
  insert into brushItxInTaskSelectionTest
  select * from brushItxInTaskSelection;
end;