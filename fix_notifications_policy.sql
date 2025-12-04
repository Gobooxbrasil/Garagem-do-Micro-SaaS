-- Enable RLS on notifications table (just in case)
alter table notifications enable row level security;

-- Create policy to allow users to delete their own notifications
-- We use a DO block to avoid errors if the policy already exists
do $$
begin
    if not exists (
        select 1 from pg_policies 
        where tablename = 'notifications' 
        and policyname = 'Users can delete own notifications'
    ) then
        create policy "Users can delete own notifications" 
        on notifications 
        for delete 
        using (auth.uid() = recipient_id);
    end if;
end $$;

-- Also ensure users can update (mark as read) their own notifications
do $$
begin
    if not exists (
        select 1 from pg_policies 
        where tablename = 'notifications' 
        and policyname = 'Users can update own notifications'
    ) then
        create policy "Users can update own notifications" 
        on notifications 
        for update
        using (auth.uid() = recipient_id);
    end if;
end $$;
