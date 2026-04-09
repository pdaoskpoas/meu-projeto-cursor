-- =====================================================
-- MIGRAÇÃO 114: RPC pública para ranking mensal de animais
-- Data: 09/04/2026
-- Descrição: A home usa o ranking de impressões do mês para exibir
-- "Top Garanhões" e "Top Doadoras". Porém, a tabela impressions
-- tem RLS que só permite SELECT para owners/partners/admins.
-- Quando um usuário logado acessa a home, a query só retorna
-- impressões dos seus próprios animais, quebrando o ranking.
--
-- Solução: Criar uma função SECURITY DEFINER que retorna apenas
-- os animal IDs rankeados por impressões do mês, sem expor dados
-- individuais de analytics. A RLS de impressions continua intacta.
-- =====================================================

-- Função que retorna o ranking mensal de animais por impressões
-- Retorna apenas: animal_id e contagem de impressões do mês
-- Não expõe quem visualizou, quando, nem dados individuais
CREATE OR REPLACE FUNCTION public.get_top_animals_by_impressions(
  p_gender TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  animal_id UUID,
  impressions BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_start_of_month TIMESTAMPTZ;
BEGIN
  v_start_of_month := date_trunc('month', now());

  RETURN QUERY
  SELECT
    i.content_id AS animal_id,
    COUNT(*) AS impressions
  FROM impressions i
  INNER JOIN animals a ON a.id = i.content_id
  WHERE i.content_type = 'animal'
    AND i.created_at >= v_start_of_month
    AND a.ad_status = 'active'
    AND (p_gender IS NULL OR a.gender = p_gender)
  GROUP BY i.content_id
  ORDER BY impressions DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_top_animals_by_impressions TO anon, authenticated;

COMMENT ON FUNCTION public.get_top_animals_by_impressions IS
  'Retorna ranking de animais por impressões do mês atual. SECURITY DEFINER para bypassar RLS de impressions sem expor dados individuais.';

-- Log de auditoria
INSERT INTO public.system_logs (operation, details)
VALUES (
  'migration_114_ranking_rpc',
  jsonb_build_object(
    'timestamp', now(),
    'reason', 'RLS de impressions bloqueava ranking na home para usuários logados',
    'fix', 'Criada RPC SECURITY DEFINER get_top_animals_by_impressions que retorna apenas IDs rankeados'
  )
);
