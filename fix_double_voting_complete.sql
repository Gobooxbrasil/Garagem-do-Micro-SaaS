-- ============================================
-- SCRIPT DE CORREÇÃO COMPLETA DO SISTEMA DE VOTOS
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- PASSO 1: Verificar a estrutura atual da view
-- (Copie o resultado para análise se necessário)
SELECT pg_get_viewdef('cached_ideas_with_stats', true);

-- PASSO 2: Recriar a view SEM duplicar a contagem de votos
-- A view deve usar o votes_count da tabela ideas (que já é atualizado pelo trigger)
-- NÃO deve fazer COUNT(*) novamente
DROP VIEW IF EXISTS cached_ideas_with_stats CASCADE;

CREATE OR REPLACE VIEW cached_ideas_with_stats AS
SELECT 
    i.*,
    -- Usar o votes_count da tabela (já atualizado pelo trigger)
    i.votes_count,
    -- Informações do criador
    p.full_name as creator_name,
    p.avatar_url as creator_avatar,
    p.email as creator_email
FROM ideas i
LEFT JOIN profiles p ON i.user_id = p.id;

-- PASSO 3: Remover votos duplicados (mantém apenas o mais antigo)
DELETE FROM idea_votes
WHERE id NOT IN (
    SELECT MIN(id)
    FROM idea_votes
    GROUP BY idea_id, user_id
);

-- PASSO 4: Recalcular votes_count correto para todas as ideias
UPDATE ideas
SET votes_count = (
    SELECT COUNT(*)
    FROM idea_votes
    WHERE idea_votes.idea_id = ideas.id
);

-- PASSO 5: Verificar se ainda há duplicatas (deve retornar 0 linhas)
SELECT 
    idea_id, 
    user_id, 
    COUNT(*) as duplicates
FROM idea_votes
GROUP BY idea_id, user_id
HAVING COUNT(*) > 1;

-- PASSO 6: Verificar se os contadores estão corretos
SELECT 
    i.id,
    i.title,
    i.votes_count as contador_na_tabela,
    COUNT(v.id) as votos_reais,
    CASE 
        WHEN i.votes_count = COUNT(v.id) THEN '✅ OK'
        ELSE '❌ DIFERENTE'
    END as status
FROM ideas i
LEFT JOIN idea_votes v ON v.idea_id = i.id
GROUP BY i.id, i.title, i.votes_count
ORDER BY i.votes_count DESC
LIMIT 20;

-- ============================================
-- RESULTADO ESPERADO:
-- - Passo 5 deve retornar 0 linhas (sem duplicatas)
-- - Passo 6 deve mostrar todos com status '✅ OK'
-- ============================================
