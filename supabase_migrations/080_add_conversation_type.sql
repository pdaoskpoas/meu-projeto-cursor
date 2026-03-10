-- Migration: Add conversation_type to differentiate direct messages
-- Description: Adiciona campo para diferenciar mensagens diretas ao haras de mensagens sobre animais específicos

-- Adiciona campo conversation_type
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS conversation_type VARCHAR(50) DEFAULT 'animal_inquiry';

-- Adiciona comentário
COMMENT ON COLUMN public.conversations.conversation_type IS 'Tipo de conversa: animal_inquiry (sobre um animal específico) ou direct_message (mensagem direta ao haras)';

-- Cria índice para otimizar buscas
CREATE INDEX IF NOT EXISTS idx_conversations_type 
ON public.conversations(conversation_type);

-- Atualiza conversas existentes para manter compatibilidade
UPDATE public.conversations
SET conversation_type = 'animal_inquiry'
WHERE conversation_type IS NULL OR conversation_type = '';


