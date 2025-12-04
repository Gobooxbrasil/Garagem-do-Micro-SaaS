-- ============================================
-- CONSOLIDATED SQL FIX FOR FEEDBACK SYSTEM
-- Execute this in Supabase SQL Editor
-- ============================================

-- 1. Drop the materialized view if it exists, then create as regular view
drop materialized view if exists feedback_with_stats;

create view feedback_with_stats as
select 
    f.id,
    f.user_id,
    f.type,
    f.title,
    f.description,
    f.status,
    f.votes_count,
    f.priority_score,
    f.created_at,
    p.full_name as creator_name,
    p.avatar_url as creator_avatar,
    (select count(*) from feedback_comments fc where fc.feedback_id = f.id) as comments_count
from feedbacks f
left join profiles p on f.user_id = p.id;

-- 2. Enable RLS on feedbacks table
alter table feedbacks enable row level security;

-- 3. Create all necessary policies for feedbacks table
do $$
begin
    -- SELECT policy (everyone can view)
    if not exists (
        select 1 from pg_policies 
        where tablename = 'feedbacks' 
        and policyname = 'Feedbacks are viewable by everyone'
    ) then
        create policy "Feedbacks are viewable by everyone" 
        on feedbacks 
        for select 
        using (true);
    end if;

    -- INSERT policy (authenticated users can create)
    if not exists (
        select 1 from pg_policies 
        where tablename = 'feedbacks' 
        and policyname = 'Authenticated users can create feedbacks'
    ) then
        create policy "Authenticated users can create feedbacks" 
        on feedbacks 
        for insert 
        with check (auth.uid() = user_id);
    end if;

    -- UPDATE policy (users can update their own)
    if not exists (
        select 1 from pg_policies 
        where tablename = 'feedbacks' 
        and policyname = 'Users can update own feedbacks'
    ) then
        create policy "Users can update own feedbacks" 
        on feedbacks 
        for update 
        using (auth.uid() = user_id);
    end if;

    -- DELETE policy for admins
    if not exists (
        select 1 from pg_policies 
        where tablename = 'feedbacks' 
        and policyname = 'Admins can delete feedbacks'
    ) then
        create policy "Admins can delete feedbacks" 
        on feedbacks 
        for delete 
        using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
    end if;

    -- DELETE policy for users (their own feedbacks)
    if not exists (
        select 1 from pg_policies 
        where tablename = 'feedbacks' 
        and policyname = 'Users can delete own feedbacks'
    ) then
        create policy "Users can delete own feedbacks" 
        on feedbacks 
        for delete 
        using (auth.uid() = user_id);
    end if;
end $$;

-- 4. Verify policies were created
select 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
from pg_policies 
where tablename = 'feedbacks'
order by policyname;
