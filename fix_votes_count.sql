-- ============================================
-- SOLUÇÃO DEFINITIVA PARA O PROBLEMA DE VOTOS
-- ============================================

-- PASSO 1: Recalcular TODOS os votes_count corretamente
UPDATE ideas
SET votes_count = (
    SELECT COUNT(*)
    FROM idea_votes
    WHERE idea_votes.idea_id = ideas.id
);

-- PASSO 2: Verificar se ficou correto (deve mostrar diferenca = 0 para todos)
SELECT 
    i.id,
    i.title,
    i.votes_count as contador_tabela,
    (SELECT COUNT(*) FROM idea_votes WHERE idea_id = i.id) as votos_reais,
    i.votes_count - (SELECT COUNT(*) FROM idea_votes WHERE idea_id = i.id) as diferenca
FROM ideas i
WHERE i.votes_count > 0
ORDER BY i.votes_count DESC
LIMIT 10;

-- ============================================
-- RESULTADO ESPERADO:
-- Todos devem ter diferenca = 0
-- ============================================
