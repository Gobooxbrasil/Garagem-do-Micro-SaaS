-- ============================================
-- DIAGNÓSTICO COMPLETO DO SISTEMA DE VOTOS
-- Execute este script para entender o problema
-- ============================================

-- 1. Ver a definição da view cached_ideas_with_stats
SELECT pg_get_viewdef('cached_ideas_with_stats'::regclass, true) as view_definition;

-- 2. Verificar se há votos duplicados
SELECT 
    idea_id,
    user_id,
    COUNT(*) as quantidade_votos,
    array_agg(id ORDER BY created_at) as ids_dos_votos,
    array_agg(created_at ORDER BY created_at) as datas
FROM idea_votes
GROUP BY idea_id, user_id
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC
LIMIT 10;

-- 3. Comparar votes_count da tabela vs COUNT real
SELECT 
    i.id,
    i.title,
    i.votes_count as contador_tabela,
    (SELECT COUNT(*) FROM idea_votes WHERE idea_id = i.id) as votos_reais,
    i.votes_count - (SELECT COUNT(*) FROM idea_votes WHERE idea_id = i.id) as diferenca
FROM ideas i
WHERE i.votes_count > 0
ORDER BY ABS(i.votes_count - (SELECT COUNT(*) FROM idea_votes WHERE idea_id = i.id)) DESC
LIMIT 10;

-- 4. Ver o trigger que atualiza votes_count
SELECT 
    tgname as trigger_name,
    tgtype,
    tgenabled,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgrelid = 'idea_votes'::regclass;

-- 5. Testar se a constraint UNIQUE está ativa
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'idea_votes'::regclass
AND contype = 'u';

-- ============================================
-- ANÁLISE DOS RESULTADOS:
-- 
-- Query 1: Mostra como a view está calculando votes_count
-- Query 2: Lista votos duplicados (se houver)
-- Query 3: Mostra discrepâncias entre contador e realidade
-- Query 4: Mostra o trigger que atualiza automaticamente
-- Query 5: Confirma se a constraint UNIQUE existe
-- ============================================
