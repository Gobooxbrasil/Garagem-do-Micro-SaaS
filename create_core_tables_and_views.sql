-- Helper function to create policy if not exists (re-declaring to be safe if running separately)
create or replace function create_policy_if_not_exists(
    policy_name text,
    table_name text,
    cmd text,
    roles text[],
    using_expression text,
    check_expression text
) returns void as $$
begin
    if not exists (
        select 1 from pg_policies 
        where tablename = table_name 
        and policyname = policy_name
    ) then
        execute format(
            'create policy %I on %I for %s to %s %s %s',
            policy_name,
            table_name,
            cmd,
            array_to_string(roles, ', '),
            case when using_expression is not null then 'using (' || using_expression || ')' else '' end,
            case when check_expression is not null then 'with check (' || check_expression || ')' else '' end
        );
    end if;
end;
$$ language plpgsql;

-- 1. Idea Votes
create table if not exists idea_votes (
  id uuid default uuid_generate_v4() primary key,
  idea_id uuid references ideas(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(idea_id, user_id)
);

alter table idea_votes enable row level security;

select create_policy_if_not_exists(
    'Votes are viewable by everyone', 'idea_votes', 'select', array['public'], 'true', null
);
select create_policy_if_not_exists(
    'Authenticated users can vote', 'idea_votes', 'insert', array['public'], null, 'auth.uid() = user_id'
);
select create_policy_if_not_exists(
    'Users can remove own vote', 'idea_votes', 'delete', array['public'], 'auth.uid() = user_id', null
);

-- 2. Favorites
create table if not exists favorites (
  id uuid default uuid_generate_v4() primary key,
  idea_id uuid references ideas(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(idea_id, user_id)
);

alter table favorites enable row level security;

select create_policy_if_not_exists(
    'Favorites are viewable by everyone', 'favorites', 'select', array['public'], 'true', null
);
select create_policy_if_not_exists(
    'Authenticated users can favorite', 'favorites', 'insert', array['public'], null, 'auth.uid() = user_id'
);
select create_policy_if_not_exists(
    'Users can remove own favorite', 'favorites', 'delete', array['public'], 'auth.uid() = user_id', null
);

-- 3. Trigger for Votes Count (cached_ideas_with_stats already exists)
create or replace function update_votes_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update ideas set votes_count = coalesce(votes_count, 0) + 1 where id = new.idea_id;
  elsif (TG_OP = 'DELETE') then
    update ideas set votes_count = greatest(coalesce(votes_count, 0) - 1, 0) where id = old.idea_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_vote_change on idea_votes;
create trigger on_vote_change
after insert or delete on idea_votes
for each row execute procedure update_votes_count();

-- Clean up helper function
drop function create_policy_if_not_exists;
