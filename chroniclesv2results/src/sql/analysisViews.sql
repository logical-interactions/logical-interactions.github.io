-- views should be parametrized by some inputs, otherwise storing as tables.
-- or that they are super short
drop view if exists allComments;
create view allComments as
  select qId, group_concat(comment, '\n')
  from answers
  group by qId;

-- cannot count from workerTasks
-- since it's auto filled
-- ground truth is in taskInfo
drop view if exists completedAll;
create view completedAll as
  select wId
  from (
    select
      wId,
      count(qId) as countQ
    from
      aggTaskInfo
    group by wId
  ) t
  where t.countQ = 14;

drop view if exists flowResults;
create view flowResults as
  select
    qId,
    group_concat(answer, ",") as answers
  from FlowSurvey
  where qId != 'comments'
  group by qId;

drop view if exists toolResults;
create view toolResults as
  select
    qId,
    group_concat(answer, ",") as answers
  from ToolSurvey
  where qId != 'comments'
  group by qId;


drop view if exists flowComments;
create view flowComments as
  select answer
  from FlowSurvey
  where qId = 'comments' and answer is not null;

drop view if exists toolComments;
create view toolComments as
  select answer
  from ToolSurvey
  where qId = 'comments' and answer is not null;

create view correctNonMemBrushTraces as
  select
    b.*
  from allCorrectNonMemTasks t
    join brushItxTraces b
      on t.wId = b.wId
      and t.qId = b.qId;

create view correctNonMemChroniclesTraces as
  select
    c.*
  from allCorrectNonMemTasks t
    join chroniclesItxTraces c
      on t.wId = c.wId
      and t.qId = c.qId;