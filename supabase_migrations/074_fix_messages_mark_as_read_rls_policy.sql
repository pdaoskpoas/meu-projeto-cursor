-- ================================================================
-- Migration: 074_fix_messages_mark_as_read_rls_policy
-- Descrição: Corrige bug do contador de mensagens não lidas
-- Data: 24/11/2025
-- ================================================================
-- 
-- PROBLEMA IDENTIFICADO:
-- Quando o usuário abre uma conversa, as mensagens são marcadas como lidas
-- através da função markConversationAsRead(), mas o contador no menu lateral
-- não é atualizado porque a política RLS de UPDATE não existe na tabela messages.
--
-- SOLUÇÃO:
-- Criar política RLS que permite que participantes da conversa marquem
-- mensagens RECEBIDAS (não enviadas por eles) como lidas, atualizando o campo read_at.
-- ================================================================

-- Criar política RLS para permitir UPDATE em mensagens recebidas
CREATE POLICY "Participants can mark received messages as read"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  -- Usuário deve ser participante da conversa
  EXISTS (
    SELECT 1
    FROM conversations
    WHERE conversations.id = messages.conversation_id
      AND (
        conversations.animal_owner_id = auth.uid() 
        OR conversations.interested_user_id = auth.uid()
      )
  )
  -- E não pode ser o remetente da mensagem (só pode marcar mensagens RECEBIDAS)
  AND messages.sender_id != auth.uid()
)
WITH CHECK (
  -- Mesmas condições para o WITH CHECK
  EXISTS (
    SELECT 1
    FROM conversations
    WHERE conversations.id = messages.conversation_id
      AND (
        conversations.animal_owner_id = auth.uid() 
        OR conversations.interested_user_id = auth.uid()
      )
  )
  AND messages.sender_id != auth.uid()
);

-- Adicionar comentário explicativo
COMMENT ON POLICY "Participants can mark received messages as read" ON public.messages IS 
  'Permite que participantes de uma conversa marquem mensagens RECEBIDAS (não enviadas por eles) como lidas, atualizando o campo read_at. Criado para corrigir bug onde o contador de mensagens não lidas não era atualizado após abrir uma conversa.';

-- ================================================================
-- FIM DA MIGRATION
-- ================================================================


