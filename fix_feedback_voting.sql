-- ============================================
-- FIX FEEDBACK VOTING SYSTEM
-- Execute this in Supabase SQL Editor
-- ============================================

-- 1. Create feedback_votes table if not exists
create table if not exists feedback_votes (
  id uuid default uuid_generate_v4() primary key,
  feedback_id uuid references feedbacks(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(feedback_id, user_id)
);

-- 2. Enable RLS on feedback_votes
alter table feedback_votes enable row level security;

-- 3. Create RLS policies for feedback_votes
do $$
begin
    -- SELECT policy (everyone can view votes)
    if not exists (
        select 1 from pg_policies 
        where tablename = 'feedback_votes' 
        and policyname = 'Votes are viewable by everyone'
    ) then
        create policy "Votes are viewable by everyone" 
        on feedback_votes 
        for select 
        using (true);
    end if;

    -- INSERT policy (authenticated users can vote)
    if not exists (
        select 1 from pg_policies 
        where tablename = 'feedback_votes' 
        and policyname = 'Authenticated users can vote'
    ) then
        create policy "Authenticated users can vote" 
        on feedback_votes 
        for insert 
        with check (auth.uid() = user_id);
    end if;

    -- DELETE policy (users can remove their own vote)
    if not exists (
        select 1 from pg_policies 
        where tablename = 'feedback_votes' 
        and policyname = 'Users can remove own vote'
    ) then
        create policy "Users can remove own vote" 
        on feedback_votes 
        for delete 
        using (auth.uid() = user_id);
    end if;
end $$;

-- 4. Create trigger function to update votes_count automatically
create or replace function update_feedback_votes_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update feedbacks set votes_count = coalesce(votes_count, 0) + 1 where id = new.feedback_id;
  elsif (TG_OP = 'DELETE') then
    update feedbacks set votes_count = greatest(coalesce(votes_count, 0) - 1, 0) where id = old.feedback_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- 5. Create trigger on feedback_votes
drop trigger if exists on_feedback_vote_change on feedback_votes;
create trigger on_feedback_vote_change
after insert or delete on feedback_votes
for each row execute procedure update_feedback_votes_count();

-- 6. Recalculate all vote counts (in case they're out of sync)
update feedbacks f
set votes_count = (
  select count(*) 
  from feedback_votes fv 
  where fv.feedback_id = f.id
);

-- 7. Verify the setup
select 
    schemaname,
    tablename,
    policyname,
    cmd
from pg_policies 
where tablename = 'feedback_votes'
order by policyname;
