-- Corrigir a chave estrangeira da tabela feedback_comments
-- O problema é que ela está apontando para "feedback_items" ao invés de "feedbacks"

-- 1. Remover a constraint antiga (se existir)
ALTER TABLE feedback_comments 
DROP CONSTRAINT IF EXISTS feedback_comments_feedback_id_fkey;

-- 2. Adicionar a constraint correta apontando para a tabela "feedbacks"
ALTER TABLE feedback_comments 
ADD CONSTRAINT feedback_comments_feedback_id_fkey 
FOREIGN KEY (feedback_id) 
REFERENCES feedbacks(id) 
ON DELETE CASCADE;

-- 3. Verificar se a constraint foi criada corretamente
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='feedback_comments';
