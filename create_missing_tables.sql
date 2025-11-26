-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- Helper function to create policy if not exists
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

-- 1. Feedbacks
create table if not exists feedbacks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null check (type in ('bug', 'feature', 'improvement', 'other')),
  title text not null,
  description text not null,
  status text default 'pending' check (status in ('pending', 'planned', 'in_progress', 'completed', 'rejected')),
  votes_count integer default 0,
  priority_score integer default 0,
  created_at timestamp with time zone default now()
);

alter table feedbacks enable row level security;

select create_policy_if_not_exists(
    'Feedbacks are viewable by everyone', 'feedbacks', 'select', array['public'], 'true', null
);
select create_policy_if_not_exists(
    'Authenticated users can create feedbacks', 'feedbacks', 'insert', array['public'], null, 'auth.uid() = user_id'
);
select create_policy_if_not_exists(
    'Users can update own feedbacks', 'feedbacks', 'update', array['public'], 'auth.uid() = user_id', null
);

-- 2. Feedback Comments
create table if not exists feedback_comments (
  id uuid default uuid_generate_v4() primary key,
  feedback_id uuid references feedbacks(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now()
);

alter table feedback_comments enable row level security;

select create_policy_if_not_exists(
    'Comments are viewable by everyone', 'feedback_comments', 'select', array['public'], 'true', null
);
select create_policy_if_not_exists(
    'Authenticated users can create comments', 'feedback_comments', 'insert', array['public'], null, 'auth.uid() = user_id'
);

-- 3. NPS Responses
create table if not exists nps_responses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  score integer not null check (score >= 0 and score <= 10),
  feedback text,
  created_at timestamp with time zone default now()
);

alter table nps_responses enable row level security;

select create_policy_if_not_exists(
    'Users can create NPS responses', 'nps_responses', 'insert', array['public'], null, 'auth.uid() = user_id'
);
select create_policy_if_not_exists(
    'Users can view own NPS', 'nps_responses', 'select', array['public'], 'auth.uid() = user_id', null
);

-- 4. Admin Logs
create table if not exists admin_logs (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone default now()
);

alter table admin_logs enable row level security;

select create_policy_if_not_exists(
    'Admins can view logs', 'admin_logs', 'select', array['public'], 'exists (select 1 from profiles where id = auth.uid() and is_admin = true)', null
);
select create_policy_if_not_exists(
    'Admins can create logs', 'admin_logs', 'insert', array['public'], null, 'exists (select 1 from profiles where id = auth.uid() and is_admin = true)'
);

-- 5. Idea Developers
create table if not exists idea_developers (
  id uuid default uuid_generate_v4() primary key,
  idea_id uuid references ideas(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now()
);

alter table idea_developers enable row level security;

select create_policy_if_not_exists(
    'Idea developers are viewable by everyone', 'idea_developers', 'select', array['public'], 'true', null
);
select create_policy_if_not_exists(
    'Authenticated users can join as developer', 'idea_developers', 'insert', array['public'], null, 'auth.uid() = user_id'
);

-- 6. Idea Improvements
create table if not exists idea_improvements (
  id uuid default uuid_generate_v4() primary key,
  idea_id uuid references ideas(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  parent_id uuid references idea_improvements(id) on delete cascade,
  created_at timestamp with time zone default now()
);

alter table idea_improvements enable row level security;

select create_policy_if_not_exists(
    'Improvements are viewable by everyone', 'idea_improvements', 'select', array['public'], 'true', null
);
select create_policy_if_not_exists(
    'Authenticated users can add improvements', 'idea_improvements', 'insert', array['public'], null, 'auth.uid() = user_id'
);

-- 7. Platform Settings
create table if not exists platform_settings (
  id uuid default uuid_generate_v4() primary key,
  global_announcement text,
  created_at timestamp with time zone default now()
);

alter table platform_settings enable row level security;

select create_policy_if_not_exists(
    'Settings are viewable by everyone', 'platform_settings', 'select', array['public'], 'true', null
);
select create_policy_if_not_exists(
    'Admins can update settings', 'platform_settings', 'update', array['public'], 'exists (select 1 from profiles where id = auth.uid() and is_admin = true)', null
);
select create_policy_if_not_exists(
    'Admins can insert settings', 'platform_settings', 'insert', array['public'], null, 'exists (select 1 from profiles where id = auth.uid() and is_admin = true)'
);

-- Insert default settings row if not exists
insert into platform_settings (global_announcement) 
select null 
where not exists (select 1 from platform_settings);

-- Clean up helper function
drop function create_policy_if_not_exists;
