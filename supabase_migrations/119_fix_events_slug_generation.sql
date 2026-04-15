-- =====================================================
-- Migration 119: Corrigir geração de slug de eventos
-- Data: 2026-04-15
-- Descrição: A migração 118 aplicava LOWER() depois do regex
--            [^a-z0-9\s-], removendo todas as letras maiúsculas
--            antes do lowercase. Resultado: "LEILÃO QUADRA" virava
--            "a" em vez de "leilao-quadra". Esta migração:
--              1. Corrige a função generate_event_slug()
--              2. Refaz o backfill de slugs de eventos existentes
-- =====================================================

-- =====================================================
-- Função corrigida: LOWER() antes do regex
-- =====================================================
CREATE OR REPLACE FUNCTION generate_event_slug(p_title TEXT, p_event_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 1;
BEGIN
  -- Ordem correta: remove acentos → LOWER → remove chars inválidos → troca espaços → colapsa hífens
  base_slug := REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        LOWER(
          TRANSLATE(
            COALESCE(p_title, ''),
            'àáâãäåāăąèéêëēėęìíîïīįòóôõöōøùúûüūůçćčñńňÀÁÂÃÄÅĀĂĄÈÉÊËĒĖĘÌÍÎÏĪĮÒÓÔÕÖŌØÙÚÛÜŪŮÇĆČÑŃŇ',
            'aaaaaaaaaeeeeeeeiiiiiioooooooouuuuuucccnnnaaaaaaaaaeeeeeeeiiiiiioooooooouuuuuucccnnn'
          )
        ),
        '[^a-z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  );
  base_slug := TRIM(BOTH '-' FROM base_slug);

  IF base_slug IS NULL OR base_slug = '' THEN
    base_slug := 'evento';
  END IF;

  final_slug := base_slug;

  WHILE EXISTS (
    SELECT 1 FROM events
    WHERE slug = final_slug
    AND (p_event_id IS NULL OR id <> p_event_id)
  ) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  RETURN final_slug;
END;
$$;

-- =====================================================
-- Refazer backfill: zerar slugs existentes e regenerar
-- a partir do title usando a função corrigida.
-- =====================================================

-- 1. Remover constraint UNIQUE temporariamente (para permitir NULL)
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_slug_unique;

-- 2. Desabilitar trigger temporariamente para não interferir no UPDATE em massa
ALTER TABLE events DISABLE TRIGGER events_set_slug;

-- 3. Zerar todos os slugs
UPDATE events SET slug = NULL;

-- 4. Regenerar slugs usando a função corrigida, um por um
--    (não em UPDATE único porque generate_event_slug precisa checar colisões
--     contra a própria tabela em atualização)
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id, title FROM events ORDER BY created_at LOOP
    UPDATE events
    SET slug = generate_event_slug(rec.title, rec.id)
    WHERE id = rec.id;
  END LOOP;
END $$;

-- 5. Reabilitar trigger
ALTER TABLE events ENABLE TRIGGER events_set_slug;

-- 6. Reaplicar UNIQUE
ALTER TABLE events
ADD CONSTRAINT events_slug_unique UNIQUE (slug);

-- =====================================================
-- Verificação
-- =====================================================
DO $$
DECLARE
  v_total INT;
  v_sample TEXT;
BEGIN
  SELECT COUNT(*) INTO v_total FROM events WHERE slug IS NOT NULL;
  SELECT slug INTO v_sample FROM events ORDER BY created_at DESC LIMIT 1;
  RAISE NOTICE '✅ Migration 119: % eventos com slug regenerado. Exemplo do último: %', v_total, v_sample;
END $$;
