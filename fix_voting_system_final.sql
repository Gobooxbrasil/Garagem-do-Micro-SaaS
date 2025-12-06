-- ============================================
-- CORREÇÃO DEFINITIVA DO SISTEMA DE VOTOS (V4)
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Remover TODOS os triggers e funções antigas com CASCADE
-- O CASCADE vai apagar automaticamente todos os triggers que dependem dessas funções
-- (trigger_ideas_cache, trigger_votes_cache, etc.)
DROP FUNCTION IF EXISTS public.trigger_refresh_cache() CASCADE;
DROP FUNCTION IF EXISTS public.refresh_ideas_cache() CASCADE;

-- Remover triggers específicos se sobrarem
DROP TRIGGER IF EXISTS on_vote_change ON public.idea_votes;
DROP TRIGGER IF EXISTS update_votes_count_trigger ON public.idea_votes;
DROP TRIGGER IF EXISTS tr_update_idea_votes ON public.idea_votes;

-- 2. Recriar a função de trigger correta (leve e direta)
CREATE OR REPLACE FUNCTION public.update_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.ideas SET votes_count = COALESCE(votes_count, 0) + 1 WHERE id = NEW.idea_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.ideas SET votes_count = GREATEST(COALESCE(votes_count, 0) - 1, 0) WHERE id = OLD.idea_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recriar o trigger (apenas UM)
CREATE TRIGGER on_vote_change
AFTER INSERT OR DELETE ON public.idea_votes
FOR EACH ROW EXECUTE PROCEDURE public.update_votes_count();

-- 4. Remover a View antiga (Materializada ou Normal)
DROP MATERIALIZED VIEW IF EXISTS public.cached_ideas_with_stats CASCADE;
DROP VIEW IF EXISTS public.cached_ideas_with_stats CASCADE;

-- 5. Recriar como VIEW NORMAL (Real-time)
CREATE VIEW public.cached_ideas_with_stats AS
SELECT 
    i.*,
    -- Joins para dados do criador
    p.full_name as creator_name,
    p.avatar_url as creator_avatar,
    p.email as creator_email
FROM public.ideas i
LEFT JOIN public.profiles p ON i.user_id = p.id;

-- 6. Limpeza final de duplicatas
DELETE FROM public.idea_votes a
USING public.idea_votes b
WHERE a.id > b.id
AND a.idea_id = b.idea_id
AND a.user_id = b.user_id;

-- 7. Garantir constraint UNIQUE
ALTER TABLE public.idea_votes 
DROP CONSTRAINT IF EXISTS idea_votes_idea_id_user_id_key;

ALTER TABLE public.idea_votes 
ADD CONSTRAINT idea_votes_idea_id_user_id_key 
UNIQUE (idea_id, user_id);

-- 8. Resetar contadores para o valor real atual
UPDATE public.ideas i
SET votes_count = (
  SELECT count(*) 
  FROM public.idea_votes iv 
  WHERE iv.idea_id = i.id
);

-- 9. Permissões
GRANT SELECT ON public.cached_ideas_with_stats TO anon, authenticated;
GRANT ALL ON public.cached_ideas_with_stats TO service_role;
