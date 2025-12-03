-- Create table for tracking project creations
create table if not exists public.project_creation_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id),
  project_type text not null check (project_type in ('idea','showroom','roadmap')),
  created_at timestamp with time zone default now()
);

-- Create index for performance
create index if not exists idx_project_creation_log_user_type_time on public.project_creation_log (user_id, project_type, created_at);

-- Enable RLS
alter table public.project_creation_log enable row level security;

-- Create policy to limit to 10 creations per hour per project type
-- 4. Create Function to check limit (Security Definer to bypass RLS on select)
create or replace function public.fn_check_project_rate_limit(p_project_type text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  -- Count records for this user and type in the last hour
  select count(*)
  into v_count
  from public.project_creation_log
  where user_id = auth.uid()
    and project_type = p_project_type
    and created_at > now() - interval '1 hour';
    
  return v_count < 10;
end;
$$;

-- 5. Create Policy
drop policy if exists "limit 10 per hour" on public.project_creation_log;

create policy "limit 10 per hour"
  on public.project_creation_log
  for insert
  with check (
    auth.uid() = user_id and
    public.fn_check_project_rate_limit(project_type)
  );
