-- =====================================================
-- MIGRATION: Soft Delete para Conversas
-- Descrição: Adiciona suporte para exclusão suave de conversas
-- Data: 2025-11-24
-- =====================================================

-- Adicionar campo deleted_for_users à tabela conversations
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS deleted_for_users UUID[] DEFAULT '{}';

-- Comentário
COMMENT ON COLUMN public.conversations.deleted_for_users IS 'Array de IDs de usuários que excluíram esta conversa (soft delete)';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_conversations_deleted_for_users ON public.conversations USING GIN (deleted_for_users);

-- =====================================================
-- ATUALIZAR VIEWS E FUNÇÕES
-- =====================================================

-- Criar função auxiliar para verificar se conversa foi deletada pelo usuário
CREATE OR REPLACE FUNCTION is_conversation_deleted_for_user(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_deleted_for UUID[];
BEGIN
  SELECT deleted_for_users INTO v_deleted_for
  FROM public.conversations
  WHERE id = p_conversation_id;
  
  IF v_deleted_for IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN p_user_id = ANY(v_deleted_for);
END;
$$;

-- Comentário
COMMENT ON FUNCTION is_conversation_deleted_for_user IS 'Verifica se uma conversa foi deletada (soft delete) por um usuário específico';

