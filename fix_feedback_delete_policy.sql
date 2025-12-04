-- Fix for feedbacks DELETE policy (corrected table name)
-- This allows admins to delete feedbacks

-- Enable RLS on feedbacks table (just in case)
alter table feedbacks enable row level security;

-- Create policy to allow admins to delete feedbacks
do $$
begin
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
end $$;

-- Also ensure users can delete their own feedback (optional, but good practice)
do $$
begin
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
