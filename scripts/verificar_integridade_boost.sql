-- =====================================================
-- SCRIPT: VERIFICAÇÃO DE INTEGRIDADE DO SISTEMA DE BOOST
-- Data: 08 de Novembro de 2025
-- Descrição: Verifica a saúde e integridade do sistema de boost
-- =====================================================

-- =====================================================
-- EXECUTAR TODOS OS CHECKS
-- =====================================================

SELECT 
  check_name,
  count,
  status,
  CASE 
    WHEN status = '✅ OK' THEN 'green'
    WHEN status = '⚠️ ATENÇÃO' THEN 'yellow'
    ELSE 'red'
  END AS severity
FROM (
  
  -- CHECK 1: Boosts expirados ainda ativos em ANIMAIS
  SELECT 
    'Boosts Expirados Ativos (Animais)' AS check_name,
    COUNT(*)::TEXT AS count,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ FALHA' END AS status
  FROM animals
  WHERE is_boosted = TRUE AND boost_expires_at < NOW()
  
  UNION ALL
  
  -- CHECK 2: Boosts expirados ainda ativos em EVENTOS
  SELECT 
    'Boosts Expirados Ativos (Eventos)',
    COUNT(*)::TEXT,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ FALHA' END
  FROM events
  WHERE is_boosted = TRUE AND boost_expires_at < NOW()

  UNION ALL

  -- CHECK 3: Usuários com saldo negativo
  SELECT 
    'Saldos Negativos (Créditos de Plano)',
    COUNT(*)::TEXT,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ FALHA' END
  FROM profiles
  WHERE plan_boost_credits < 0
  
  UNION ALL
  
  SELECT 
    'Saldos Negativos (Créditos Comprados)',
    COUNT(*)::TEXT,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ FALHA' END
  FROM profiles
  WHERE purchased_boost_credits < 0

  UNION ALL

  -- CHECK 4: Boosts órfãos em ANIMAIS (sem registro em histórico)
  SELECT 
    'Boosts Órfãos (Animais)',
    COUNT(*)::TEXT,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '⚠️ ATENÇÃO' END
  FROM animals a
  WHERE a.is_boosted = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM boost_history bh
      WHERE bh.content_id = a.id 
        AND bh.content_type = 'animal'
        AND bh.is_active = TRUE
    )
    
  UNION ALL
  
  -- CHECK 5: Boosts órfãos em EVENTOS (sem registro em histórico)
  SELECT 
    'Boosts Órfãos (Eventos)',
    COUNT(*)::TEXT,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '⚠️ ATENÇÃO' END
  FROM events e
  WHERE e.is_boosted = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM boost_history bh
      WHERE bh.content_id = e.id 
        AND bh.content_type = 'event'
        AND bh.is_active = TRUE
    )
    
  UNION ALL
  
  -- CHECK 6: Histórico ativo sem item correspondente
  SELECT 
    'Histórico Ativo Órfão (Animais)',
    COUNT(*)::TEXT,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '⚠️ ATENÇÃO' END
  FROM boost_history bh
  WHERE bh.content_type = 'animal'
    AND bh.is_active = TRUE
    AND bh.expires_at > NOW()
    AND NOT EXISTS (
      SELECT 1 FROM animals a
      WHERE a.id = bh.content_id AND a.is_boosted = TRUE
    )
    
  UNION ALL
  
  SELECT 
    'Histórico Ativo Órfão (Eventos)',
    COUNT(*)::TEXT,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '⚠️ ATENÇÃO' END
  FROM boost_history bh
  WHERE bh.content_type = 'event'
    AND bh.is_active = TRUE
    AND bh.expires_at > NOW()
    AND NOT EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = bh.content_id AND e.is_boosted = TRUE
    )
    
  UNION ALL
  
  -- CHECK 7: Cron job configurado
  SELECT 
    'Cron Job Configurado',
    CASE 
      WHEN EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-boosts-every-5min') 
      THEN '1' 
      ELSE '0' 
    END::TEXT,
    CASE 
      WHEN EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-boosts-every-5min') 
      THEN '✅ OK' 
      ELSE '⚠️ NÃO CONFIGURADO' 
    END
    
  UNION ALL
  
  -- CHECK 8: Funções atômicas existem
  SELECT 
    'Função boost_animal_atomic',
    CASE 
      WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'boost_animal_atomic') 
      THEN '1' 
      ELSE '0' 
    END::TEXT,
    CASE 
      WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'boost_animal_atomic') 
      THEN '✅ OK' 
      ELSE '❌ NÃO EXISTE' 
    END
    
  UNION ALL
  
  SELECT 
    'Função boost_event_atomic',
    CASE 
      WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'boost_event_atomic') 
      THEN '1' 
      ELSE '0' 
    END::TEXT,
    CASE 
      WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'boost_event_atomic') 
      THEN '✅ OK' 
      ELSE '❌ NÃO EXISTE' 
    END

) AS checks
ORDER BY 
  CASE status
    WHEN '❌ FALHA' THEN 1
    WHEN '⚠️ ATENÇÃO' THEN 2
    WHEN '⚠️ NÃO CONFIGURADO' THEN 3
    WHEN '❌ NÃO EXISTE' THEN 4
    ELSE 5
  END,
  check_name;

-- =====================================================
-- ESTATÍSTICAS GERAIS
-- =====================================================

SELECT 
  '======== ESTATÍSTICAS GERAIS ========' AS info;

SELECT * FROM public.get_boost_expiration_stats();

-- =====================================================
-- DETALHES DOS PROBLEMAS (SE HOUVER)
-- =====================================================

-- Se houver boosts expirados ativos, mostrar detalhes
DO $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_expired_count
  FROM animals
  WHERE is_boosted = TRUE AND boost_expires_at < NOW();
  
  IF v_expired_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ ATENÇÃO: % animais com boost expirado ainda ativo!', v_expired_count;
    RAISE NOTICE 'Execute: SELECT * FROM public.expire_boosts();';
  END IF;
END $$;

-- =====================================================
-- ANÁLISE DE SALDOS
-- =====================================================

SELECT 
  '======== ANÁLISE DE SALDOS ========' AS info;

SELECT 
  plan,
  COUNT(*) AS usuarios,
  SUM(plan_boost_credits) AS total_plan_credits,
  SUM(purchased_boost_credits) AS total_purchased_credits,
  AVG(plan_boost_credits) AS avg_plan_credits,
  AVG(purchased_boost_credits) AS avg_purchased_credits
FROM profiles
GROUP BY plan
ORDER BY plan;

-- =====================================================
-- ÚLTIMOS BOOSTS (TOP 10)
-- =====================================================

SELECT 
  '======== ÚLTIMOS 10 BOOSTS ========' AS info;

SELECT 
  bh.content_type,
  CASE 
    WHEN bh.content_type = 'animal' THEN a.name
    WHEN bh.content_type = 'event' THEN e.title
  END AS content_name,
  p.name AS user_name,
  bh.boost_type,
  bh.started_at,
  bh.expires_at,
  bh.is_active,
  CASE 
    WHEN bh.expires_at > NOW() THEN 'ATIVO'
    ELSE 'EXPIRADO'
  END AS status_atual
FROM boost_history bh
LEFT JOIN animals a ON bh.content_type = 'animal' AND bh.content_id = a.id
LEFT JOIN events e ON bh.content_type = 'event' AND bh.content_id = e.id
LEFT JOIN profiles p ON bh.user_id = p.id
ORDER BY bh.started_at DESC
LIMIT 10;

-- =====================================================
-- RESUMO FINAL
-- =====================================================

SELECT 
  '======== RESUMO FINAL ========' AS info;

SELECT 
  (SELECT COUNT(*) FROM animals WHERE is_boosted = TRUE) AS animais_boosted_agora,
  (SELECT COUNT(*) FROM events WHERE is_boosted = TRUE) AS eventos_boosted_agora,
  (SELECT COUNT(*) FROM boost_history WHERE is_active = TRUE) AS historico_ativo,
  (SELECT COUNT(*) FROM boost_history WHERE is_active = TRUE AND expires_at < NOW()) AS boosts_expirados_bug,
  CASE 
    WHEN (SELECT COUNT(*) FROM boost_history WHERE is_active = TRUE AND expires_at < NOW()) = 0 
    THEN '✅ SISTEMA SAUDÁVEL'
    ELSE '❌ REQUER ATENÇÃO'
  END AS status_geral;


