-- Adiciona coluna para vincular patrocinador a um perfil institucional (haras) do site
ALTER TABLE sponsors
  ADD COLUMN IF NOT EXISTS linked_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Habilita ação de clique no logo (redirecionar para haras ou website externo)
ALTER TABLE sponsors
  ADD COLUMN IF NOT EXISTS click_action_enabled BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_sponsors_linked_profile ON sponsors(linked_profile_id)
  WHERE linked_profile_id IS NOT NULL;

COMMENT ON COLUMN sponsors.linked_profile_id IS
  'ID do perfil institucional (haras) vinculado. Quando preenchido, o clique no banner redireciona para /haras/{id} em vez do website_url.';

COMMENT ON COLUMN sponsors.click_action_enabled IS
  'Quando true, o clique no logo do patrocinador redireciona para linked_profile_id (interno) ou website_url (externo).';

-- Recriar a view active_sponsors incluindo os novos campos
DROP VIEW IF EXISTS public.active_sponsors CASCADE;
CREATE VIEW public.active_sponsors
WITH (security_invoker = true)
AS
SELECT
  id,
  name,
  description,
  website_url,
  logo_url,
  logo_horizontal_url,
  logo_square_url,
  logo_vertical_url,
  display_priority,
  display_locations,
  click_count,
  impression_count,
  linked_profile_id,
  click_action_enabled
FROM sponsors
WHERE
  is_active = true AND
  (start_date IS NULL OR start_date <= NOW()) AND
  (end_date IS NULL OR end_date >= NOW())
ORDER BY display_priority DESC, created_at DESC;

GRANT SELECT ON public.active_sponsors TO anon, authenticated;
