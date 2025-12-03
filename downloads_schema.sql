-- Create downloads table
create table if not exists public.downloads (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  file_url text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.downloads enable row level security;

-- Policies
-- Admin can do everything
create policy "Admins can do everything on downloads"
  on public.downloads
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Users can view (select) only
create policy "Users can view downloads"
  on public.downloads
  for select
  using (true);
