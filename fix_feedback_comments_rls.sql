-- Verificar se a tabela feedback_comments existe e tem RLS habilitado
-- Depois criar as políticas necessárias para permitir inserção de comentários

-- Habilitar RLS na tabela
ALTER TABLE feedback_comments ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (todos podem ler comentários)
DROP POLICY IF EXISTS "feedback_comments_select_policy" ON feedback_comments;
CREATE POLICY "feedback_comments_select_policy" 
ON feedback_comments FOR SELECT 
TO authenticated 
USING (true);

-- Política para INSERT (usuários autenticados podem inserir comentários)
DROP POLICY IF EXISTS "feedback_comments_insert_policy" ON feedback_comments;
CREATE POLICY "feedback_comments_insert_policy" 
ON feedback_comments FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Política para DELETE (apenas o criador ou admin pode deletar)
DROP POLICY IF EXISTS "feedback_comments_delete_policy" ON feedback_comments;
CREATE POLICY "feedback_comments_delete_policy" 
ON feedback_comments FOR DELETE 
TO authenticated 
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Verificar as políticas criadas
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'feedback_comments'
ORDER BY policyname;
