-- =====================================================
-- CORREÇÃO URGENTE: Policy de UPDATE para conversas
-- =====================================================
-- PROBLEMA IDENTIFICADO:
-- A tabela 'conversations' não tinha policy de UPDATE,
-- impedindo que o campo 'is_temporary' fosse atualizado
-- quando mensagens eram enviadas. Isso causava o bug onde
-- o proprietário do animal não via a conversa na lista.
-- =====================================================

-- Adicionar policy de UPDATE para permitir participantes atualizarem conversas
CREATE POLICY "Participants can update own conversations"
ON conversations
FOR UPDATE
TO public
USING (
  animal_owner_id = auth.uid() OR interested_user_id = auth.uid()
)
WITH CHECK (
  animal_owner_id = auth.uid() OR interested_user_id = auth.uid()
);

-- Comentário explicativo
COMMENT ON POLICY "Participants can update own conversations" ON conversations IS 
'Permite que participantes da conversa (proprietário ou interessado) atualizem campos como is_temporary, updated_at, etc.';

-- =====================================================
-- Corrigir conversas existentes que ficaram travadas
-- =====================================================

-- Atualizar todas as conversas que têm mensagens mas ainda estão marcadas como temporárias
UPDATE conversations
SET 
  is_temporary = false,
  updated_at = NOW()
WHERE 
  is_temporary = true 
  AND EXISTS (
    SELECT 1 FROM messages m 
    WHERE m.conversation_id = conversations.id
  );

-- =====================================================
-- COMO APLICAR:
-- =====================================================
-- 1. Copie este SQL
-- 2. Vá até o Supabase Dashboard > SQL Editor
-- 3. Cole e execute este script
-- 4. Teste novamente o fluxo de mensagens
-- =====================================================

