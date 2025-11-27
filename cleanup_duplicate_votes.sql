-- Script para limpar votos duplicados e recalcular contadores
-- Execute este script no SQL Editor do Supabase

-- 1. Remover votos duplicados (mantém apenas o mais antigo de cada usuário por ideia)
DELETE FROM idea_votes
WHERE id NOT IN (
    SELECT MIN(id)
    FROM idea_votes
    GROUP BY idea_id, user_id
);

-- 2. Recalcular o votes_count correto para todas as ideias
UPDATE ideas
SET votes_count = (
    SELECT COUNT(*)
    FROM idea_votes
    WHERE idea_votes.idea_id = ideas.id
);

-- 3. Verificar se há duplicatas restantes (deve retornar 0)
SELECT idea_id, user_id, COUNT(*) as duplicates
FROM idea_votes
GROUP BY idea_id, user_id
HAVING COUNT(*) > 1;
