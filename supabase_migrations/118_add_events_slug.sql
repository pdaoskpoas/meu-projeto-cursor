-- =====================================================
-- Migration 118: Adicionar Slug para Eventos (SEO)
-- Data: 2026-04-15
-- Descrição: Adiciona campo slug único em events para URLs
--            amigáveis (ex: /eventos/copa-do-brasil-2026),
--            equivalente ao que já existe em articles (migration 068).
-- =====================================================

-- Adicionar campo slug
ALTER TABLE events
ADD COLUMN IF NOT EXISTS slug TEXT;

COMMENT ON COLUMN events.slug IS 'Slug único para URL amigável (SEO) - ex: copa-do-brasil-2026';

-- Gerar slugs para eventos existentes (baseado no title)
UPDATE events
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRANSLATE(
          title,
          'àáâãäåāăąèéêëēėęìíîïīįòóôõöōøùúûüūůçćčñńňÀÁÂÃÄÅĀĂĄÈÉÊËĒĖĘÌÍÎÏĪĮÒÓÔÕÖŌØÙÚÛÜŪŮÇĆČÑŃŇ',
          'aaaaaaaaaeeeeeeeiiiiiioooooooouuuuuucccnnnaaaaaaaaaeeeeeeeiiiiiioooooooouuuuuucccnnn'
        ),
        '[^a-z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- Remover hífens das pontas
UPDATE events
SET slug = TRIM(BOTH '-' FROM slug)
WHERE slug IS NOT NULL;

-- Garantir unicidade de slugs (adicionar sufixo numérico em duplicados)
DO $$
DECLARE
  event_record RECORD;
  new_slug TEXT;
  counter INT;
BEGIN
  FOR event_record IN
    SELECT id, slug
    FROM events
    WHERE slug IS NOT NULL AND slug <> ''
    ORDER BY created_at
  LOOP
    counter := 1;
    new_slug := event_record.slug;

    WHILE EXISTS (
      SELECT 1 FROM events
      WHERE slug = new_slug
      AND id <> event_record.id
    ) LOOP
      new_slug := event_record.slug || '-' || counter;
      counter := counter + 1;
    END LOOP;

    IF new_slug <> event_record.slug THEN
      UPDATE events SET slug = new_slug WHERE id = event_record.id;
    END IF;
  END LOOP;
END $$;

-- Fallback: se algum evento ainda ficou sem slug (title vazio/só símbolos),
-- usa o prefixo do próprio UUID para não ficar NULL.
UPDATE events
SET slug = 'evento-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL OR slug = '';

-- Aplicar UNIQUE + índice
ALTER TABLE events
ADD CONSTRAINT events_slug_unique UNIQUE (slug);

CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

-- =====================================================
-- Função para gerar slug a partir de um título
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
  base_slug := LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          TRANSLATE(
            COALESCE(p_title, ''),
            'àáâãäåāăąèéêëēėęìíîïīįòóôõöōøùúûüūůçćčñńňÀÁÂÃÄÅĀĂĄÈÉÊËĒĖĘÌÍÎÏĪĮÒÓÔÕÖŌØÙÚÛÜŪŮÇĆČÑŃŇ',
            'aaaaaaaaaeeeeeeeiiiiiioooooooouuuuuucccnnnaaaaaaaaaeeeeeeeiiiiiioooooooouuuuuucccnnn'
          ),
          '[^a-z0-9\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
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

COMMENT ON FUNCTION generate_event_slug IS 'Gera slug único para eventos, aplicando sufixo numérico se houver colisão.';

-- =====================================================
-- Trigger: gerar slug automaticamente em INSERT/UPDATE
-- =====================================================
CREATE OR REPLACE FUNCTION trg_events_set_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- INSERT: se slug não foi fornecido, gera a partir do title
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
      NEW.slug := generate_event_slug(NEW.title, NULL);
    END IF;
  END IF;

  -- UPDATE: se title mudou e slug não foi explicitamente alterado, regenera
  IF TG_OP = 'UPDATE' THEN
    IF NEW.title IS DISTINCT FROM OLD.title
       AND NEW.slug IS NOT DISTINCT FROM OLD.slug THEN
      NEW.slug := generate_event_slug(NEW.title, NEW.id);
    END IF;

    IF NEW.slug IS NULL OR NEW.slug = '' THEN
      NEW.slug := generate_event_slug(NEW.title, NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_set_slug ON events;
CREATE TRIGGER events_set_slug
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION trg_events_set_slug();

-- =====================================================
-- Atualizar view events_with_stats para incluir slug
-- (substitui migration 113)
-- =====================================================
DROP VIEW IF EXISTS events_with_stats CASCADE;

CREATE VIEW events_with_stats
WITH (security_invoker = true)
AS
SELECT
  e.*,
  COALESCE(p.property_name, p.name, 'Usuário') AS organizer_name,
  p.public_code                                 AS organizer_public_code,
  p.account_type                                AS organizer_account_type,
  COALESCE(imp.impression_count, 0) AS impressions,
  COALESCE(clk.click_count, 0)      AS clicks,
  CASE
    WHEN COALESCE(imp.impression_count, 0) > 0
    THEN ROUND(COALESCE(clk.click_count, 0)::NUMERIC / imp.impression_count::NUMERIC * 100, 2)
    ELSE 0
  END AS ctr
FROM events e
LEFT JOIN public_profiles p ON e.organizer_id = p.id
LEFT JOIN (
  SELECT content_id, COUNT(*) AS impression_count
  FROM impressions
  WHERE content_type = 'event'
  GROUP BY content_id
) imp ON e.id = imp.content_id
LEFT JOIN (
  SELECT content_id, COUNT(*) AS click_count
  FROM clicks
  WHERE content_type = 'event'
  GROUP BY content_id
) clk ON e.id = clk.content_id;

GRANT SELECT ON events_with_stats TO anon, authenticated;

COMMENT ON VIEW events_with_stats IS 'Eventos com estatísticas, incluindo slug (migration 118). JOIN em public_profiles para compatibilidade com RLS de anon.';

-- =====================================================
-- Atualizar webhook IndexNow para usar slug em eventos
-- (substitui trecho correspondente da migration 117)
-- =====================================================
CREATE OR REPLACE FUNCTION public.seo_ping_indexnow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
DECLARE
  v_table text := tg_table_name;
  v_url   text;
  v_sec   text;
  v_path  text;
  v_should boolean := false;
BEGIN
  SELECT value INTO v_url FROM private.seo_settings WHERE key = 'site_url';
  SELECT value INTO v_sec FROM private.seo_settings WHERE key = 'indexnow_secret';

  IF v_url IS NULL OR v_sec IS NULL THEN
    RETURN new;
  END IF;

  IF v_table = 'animals' THEN
    v_path := '/animal/' || new.id::text;
    v_should := (tg_op = 'INSERT' AND COALESCE(new.ad_status, 'active') NOT IN ('suspended','deleted'))
             OR (tg_op = 'UPDATE' AND (
                  COALESCE(old.ad_status,'') IS DISTINCT FROM COALESCE(new.ad_status,'')
                  OR COALESCE(old.published_at::text,'') IS DISTINCT FROM COALESCE(new.published_at::text,'')
                  OR COALESCE(old.name,'') IS DISTINCT FROM COALESCE(new.name,'')
                  OR COALESCE(old.description,'') IS DISTINCT FROM COALESCE(new.description,'')
                ));
  ELSIF v_table = 'articles' THEN
    v_path := '/noticias/' || COALESCE(new.slug, new.id::text);
    v_should := (tg_op = 'INSERT' AND COALESCE(new.is_published, false) = true)
             OR (tg_op = 'UPDATE' AND (
                  COALESCE(old.is_published, false) IS DISTINCT FROM COALESCE(new.is_published, false)
                  OR (COALESCE(new.is_published, false) = true AND (
                        COALESCE(old.title,'')   IS DISTINCT FROM COALESCE(new.title,'')
                     OR COALESCE(old.content,'') IS DISTINCT FROM COALESCE(new.content,'')
                  ))
                ));
  ELSIF v_table = 'events' THEN
    v_path := '/eventos/' || COALESCE(new.slug, new.id::text);
    v_should := (tg_op = 'INSERT' AND COALESCE(new.ad_status,'active') NOT IN ('suspended','deleted'))
             OR (tg_op = 'UPDATE' AND (
                  COALESCE(old.ad_status,'') IS DISTINCT FROM COALESCE(new.ad_status,'')
                  OR COALESCE(old.title,'') IS DISTINCT FROM COALESCE(new.title,'')
                  OR COALESCE(old.slug,'') IS DISTINCT FROM COALESCE(new.slug,'')
                  OR COALESCE(old.start_date::text,'') IS DISTINCT FROM COALESCE(new.start_date::text,'')
                ));
  ELSIF v_table = 'profiles' THEN
    v_path := '/haras/' || new.id::text;
    v_should := (COALESCE(new.is_active,true) = true AND COALESCE(new.is_suspended,false) = false)
            AND (tg_op = 'INSERT'
                 OR COALESCE(old.is_suspended,false) IS DISTINCT FROM COALESCE(new.is_suspended,false)
                 OR COALESCE(old.is_active,true)     IS DISTINCT FROM COALESCE(new.is_active,true)
                 OR COALESCE(old.property_name,'')   IS DISTINCT FROM COALESCE(new.property_name,'')
                 OR COALESCE(old.name,'')            IS DISTINCT FROM COALESCE(new.name,''));
  END IF;

  IF v_should THEN
    PERFORM net.http_post(
      url := v_url || '/api/indexnow',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_sec
      ),
      body := jsonb_build_object(
        'table', v_table,
        'op', tg_op,
        'urls', jsonb_build_array(v_path)
      ),
      timeout_milliseconds := 5000
    );
  END IF;

  RETURN new;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 118: slug adicionado em events; trigger auto-gera slug; view events_with_stats e webhook IndexNow atualizados.';
END $$;
