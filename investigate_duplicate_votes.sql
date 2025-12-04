-- ============================================
-- INVESTIGATE DUPLICATE VOTES ISSUE
-- Execute this in Supabase SQL Editor
-- ============================================

-- 1. Check all triggers on feedback_votes table
select 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
from information_schema.triggers
where event_object_table = 'feedback_votes';

-- 2. Check if there are multiple triggers on feedbacks table that might be causing issues
select 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
from information_schema.triggers
where event_object_table = 'feedbacks';

-- 3. Check for any duplicate constraint names
select 
    constraint_name,
    count(*) as count
from information_schema.table_constraints
where table_name = 'feedback_votes'
group by constraint_name
having count(*) > 1;

-- 4. List all constraints on feedback_votes
select 
    constraint_name,
    constraint_type
from information_schema.table_constraints
where table_name = 'feedback_votes';
