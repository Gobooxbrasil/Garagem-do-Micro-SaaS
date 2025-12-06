-- ============================================
-- VERIFY AND FIX UNIQUE CONSTRAINT ON IDEA_VOTES
-- Execute this in Supabase SQL Editor
-- ============================================

-- 1. First, remove any duplicate votes that may already exist
-- Keeps the one with the smallest ID (usually the first one)
DELETE FROM public.idea_votes a
USING public.idea_votes b
WHERE a.id > b.id
AND a.idea_id = b.idea_id
AND a.user_id = b.user_id;

-- 2. Drop the existing unique constraint if it exists (to be safe)
ALTER TABLE public.idea_votes 
DROP CONSTRAINT IF EXISTS idea_votes_idea_id_user_id_key;

-- 3. Add the unique constraint
ALTER TABLE public.idea_votes 
ADD CONSTRAINT idea_votes_idea_id_user_id_key 
UNIQUE (idea_id, user_id);

-- 4. Recalculate vote counts to fix any discrepancies
UPDATE public.ideas i
SET votes_count = (
  SELECT count(*) 
  FROM public.idea_votes iv 
  WHERE iv.idea_id = i.id
);
