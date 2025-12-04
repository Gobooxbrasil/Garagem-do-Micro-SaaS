-- ============================================
-- VERIFY AND FIX UNIQUE CONSTRAINT ON FEEDBACK_VOTES
-- Execute this in Supabase SQL Editor
-- ============================================

-- 1. First, remove any duplicate votes that may already exist
delete from feedback_votes a
using feedback_votes b
where a.id > b.id
and a.feedback_id = b.feedback_id
and a.user_id = b.user_id;

-- 2. Drop the existing unique constraint if it exists
alter table feedback_votes 
drop constraint if exists feedback_votes_feedback_id_user_id_key;

-- 3. Add the unique constraint
alter table feedback_votes 
add constraint feedback_votes_feedback_id_user_id_key 
unique (feedback_id, user_id);

-- 4. Verify the constraint was created
select
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
from information_schema.table_constraints as tc
join information_schema.key_column_usage as kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
where tc.table_name = 'feedback_votes'
and tc.constraint_type = 'UNIQUE'
order by kcu.ordinal_position;

-- 5. Recalculate vote counts to fix any discrepancies
update feedbacks f
set votes_count = (
  select count(*) 
  from feedback_votes fv 
  where fv.feedback_id = f.id
);
