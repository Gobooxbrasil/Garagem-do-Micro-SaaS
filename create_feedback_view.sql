-- Create or replace the feedback_with_stats view
-- This view aggregates feedback data with vote counts and creator information

drop view if exists feedback_with_stats;

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
