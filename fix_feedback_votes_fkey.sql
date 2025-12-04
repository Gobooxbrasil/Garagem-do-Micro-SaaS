-- ============================================
-- FIX FEEDBACK_VOTES FOREIGN KEY CONSTRAINT
-- Execute this in Supabase SQL Editor
-- ============================================

-- 1. Drop the existing foreign key constraint (if it exists)
alter table feedback_votes 
drop constraint if exists feedback_votes_feedback_id_fkey;

-- 2. Add the correct foreign key constraint pointing to 'feedbacks' table
alter table feedback_votes 
add constraint feedback_votes_feedback_id_fkey 
foreign key (feedback_id) 
references feedbacks(id) 
on delete cascade;

-- 3. Verify the constraint was created correctly
select
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name as foreign_table_name,
    ccu.column_name as foreign_column_name
from information_schema.table_constraints as tc
join information_schema.key_column_usage as kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage as ccu
  on ccu.constraint_name = tc.constraint_name
  and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY' 
and tc.table_name = 'feedback_votes';
