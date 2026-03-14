-- =====================================================
-- MIGRATION 095: Remover Eventos de Teste
-- Data: 2025-01-XX
-- Descrição: Remove todos os eventos publicados que foram criados para teste
-- =====================================================

-- Primeiro, mostrar quantos eventos serão removidos
DO $$
DECLARE
  event_count INTEGER;
  event_list TEXT;
BEGIN
  -- Contar eventos que serão removidos (apenas ad_status = 'active')
  SELECT COUNT(*) INTO event_count
  FROM events
  WHERE ad_status = 'active';
  
  -- Listar primeiros 10 eventos (usando apenas id e title que existem)
  SELECT string_agg(title, ', ')
  INTO event_list
  FROM (
    SELECT title
    FROM events
    WHERE ad_status = 'active'
    LIMIT 10
  ) sub;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Removendo eventos de teste';
  RAISE NOTICE 'Total de eventos a remover: %', event_count;
  IF event_list IS NOT NULL AND event_list != '' THEN
    RAISE NOTICE 'Primeiros eventos: %', event_list;
  END IF;
  RAISE NOTICE '========================================';
END $$;

-- Deletar todos os eventos que estão publicados (ad_status = 'active')
-- Isso remove todos os eventos de teste que foram criados
DELETE FROM events
WHERE ad_status = 'active';

-- Confirmar remoção
DO $$
DECLARE
  deleted_count INTEGER;
  remaining_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Verificar quantos eventos restam
  SELECT COUNT(*) INTO remaining_count
  FROM events
  WHERE ad_status = 'active';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Eventos removidos: %', deleted_count;
  RAISE NOTICE '✅ Eventos publicados restantes: %', remaining_count;
  RAISE NOTICE '========================================';
END $$;
