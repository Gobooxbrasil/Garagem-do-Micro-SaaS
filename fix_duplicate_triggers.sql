-- ============================================
-- FIX DUPLICATE TRIGGERS ON FEEDBACK_VOTES
-- Execute this in Supabase SQL Editor
-- ============================================

-- 1. Drop all existing triggers on feedback_votes
drop trigger if exists on_feedback_vote_change on feedback_votes;
drop trigger if exists trigger_update_feedback_votes on feedback_votes;

-- 2. Keep only ONE trigger with a clear name
create trigger on_feedback_vote_change
after insert or delete on feedback_votes
for each row execute procedure update_feedback_votes_count();

-- 3. Recalculate all vote counts to fix any discrepancies
update feedbacks f
set votes_count = (
  select count(*) 
  from feedback_votes fv 
  where fv.feedback_id = f.id
);

-- 4. Verify only one trigger exists now
select 
    trigger_name,
    event_manipulation,
    action_statement
from information_schema.triggers
where event_object_table = 'feedback_votes';
