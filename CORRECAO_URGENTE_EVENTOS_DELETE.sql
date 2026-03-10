-- ========================================
-- CORREÇÃO URGENTE: Política de DELETE para Eventos
-- ========================================
-- 
-- PROBLEMA: Botão "Excluir" não funciona porque não existe
-- política RLS permitindo DELETE na tabela events
--
-- SOLUÇÃO: Adicionar política para permitir que organizadores
-- excluam seus próprios eventos
--
-- ========================================

-- Adicionar política RLS para DELETE
CREATE POLICY "Organizers can delete own events"
ON public.events
FOR DELETE
TO public
USING (organizer_id = auth.uid());

-- ========================================
-- VERIFICAÇÃO
-- ========================================
-- 
-- Para verificar se a política foi criada com sucesso:
-- 
-- SELECT policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'events' AND cmd = 'DELETE';
--
-- Resultado esperado:
-- | policyname                       | cmd    | qual                               |
-- |----------------------------------|--------|------------------------------------|
-- | Organizers can delete own events | DELETE | (organizer_id = auth.uid())        |
--
-- ========================================



