-- =====================================================
-- SISTEMA DE ROTAÇÃO SIMPLIFICADO E TESTADO
-- Versão que NÃO depende de views complexas
-- Data: 17/11/2025
-- =====================================================

-- =====================================================
-- LIMPEZA: Remover funções antigas
-- =====================================================

DROP FUNCTION IF EXISTS get_featured_animals_rotated_fast(INTEGER);
DROP FUNCTION IF EXISTS get_featured_animals_rotated(INTEGER);

-- =====================================================
-- FUNÇÃO PRINCIPAL: Rotação de Impulsionados
-- Versão SIMPLIFICADA que busca direto das tabelas
-- =====================================================

CREATE OR REPLACE FUNCTION get_featured_animals_rotated_fast(
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    breed TEXT,
    gender TEXT,
    birth_date DATE,
    coat TEXT,
    current_city TEXT,
    current_state TEXT,
    owner_id UUID,
    images JSONB,
    is_boosted BOOLEAN,
    boost_expires_at TIMESTAMP WITH TIME ZONE,
    boosted_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    ad_status TEXT,
    rotation_position INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_boosted INTEGER;
    v_rotation_offset INTEGER;
    v_minute_counter INTEGER;
BEGIN
    -- Contar total de animais impulsionados ativos
    SELECT COUNT(*) INTO v_total_boosted
    FROM animals anim
    WHERE anim.is_boosted = TRUE
      AND anim.boost_expires_at IS NOT NULL
      AND anim.boost_expires_at > NOW()
      AND anim.ad_status = 'active';
    
    -- Se não há animais impulsionados, retornar vazio
    IF v_total_boosted = 0 OR v_total_boosted IS NULL THEN
        RETURN;
    END IF;
    
    -- Calcular minuto atual para rotação
    v_minute_counter := FLOOR(EXTRACT(EPOCH FROM NOW()) / 60)::INTEGER;
    
    -- Calcular offset de rotação (move 1 posição por minuto)
    v_rotation_offset := v_minute_counter % v_total_boosted;
    
    -- Retornar animais com rotação aplicada
    RETURN QUERY
    WITH boosted_animals AS (
        SELECT 
            anim.id,
            anim.name,
            anim.breed,
            anim.gender,
            anim.birth_date,
            anim.coat,
            anim.current_city,
            anim.current_state,
            anim.owner_id,
            anim.images,
            anim.is_boosted,
            anim.boost_expires_at,
            anim.boosted_at,
            anim.published_at,
            anim.ad_status,
            ROW_NUMBER() OVER (ORDER BY anim.boosted_at ASC, anim.id ASC) AS original_position
        FROM animals anim
        WHERE anim.is_boosted = TRUE
          AND anim.boost_expires_at IS NOT NULL
          AND anim.boost_expires_at > NOW()
          AND anim.ad_status = 'active'
    ),
    rotated_animals AS (
        SELECT 
            ba.id,
            ba.name,
            ba.breed,
            ba.gender,
            ba.birth_date,
            ba.coat,
            ba.current_city,
            ba.current_state,
            ba.owner_id,
            ba.images,
            ba.is_boosted,
            ba.boost_expires_at,
            ba.boosted_at,
            ba.published_at,
            ba.ad_status,
            ((ba.original_position - 1 + v_rotation_offset) % v_total_boosted) + 1 AS rotation_position
        FROM boosted_animals ba
    )
    SELECT 
        ra.id,
        ra.name,
        ra.breed,
        ra.gender,
        ra.birth_date,
        ra.coat,
        ra.current_city,
        ra.current_state,
        ra.owner_id,
        ra.images,
        ra.is_boosted,
        ra.boost_expires_at,
        ra.boosted_at,
        ra.published_at,
        ra.ad_status,
        ra.rotation_position::INTEGER
    FROM rotated_animals ra
    ORDER BY ra.rotation_position ASC
    LIMIT p_limit;
END;
$$;

-- Comentário descritivo
COMMENT ON FUNCTION get_featured_animals_rotated_fast IS 
'Retorna animais impulsionados com rotação automática (1 minuto).
- Limite padrão: 10 anúncios
- Rotação: muda a cada minuto
- Distribuição: 100% equitativa
- Versão simplificada que busca direto da tabela animals';

-- =====================================================
-- GRANT DE PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION get_featured_animals_rotated_fast(INTEGER) TO authenticated, anon;

-- =====================================================
-- TESTES BÁSICOS
-- =====================================================

-- Teste 1: Verificar se função foi criada
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_featured_animals_rotated_fast'
    ) THEN
        RAISE NOTICE '✅ Função get_featured_animals_rotated_fast criada com sucesso!';
    ELSE
        RAISE WARNING '❌ Função não foi criada';
    END IF;
END $$;

-- Teste 2: Contar animais impulsionados
DO $$
DECLARE
    v_total INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total
    FROM animals a
    WHERE a.is_boosted = TRUE 
      AND a.boost_expires_at > NOW() 
      AND a.ad_status = 'active';
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 ESTATÍSTICAS:';
    RAISE NOTICE '  Total de animais impulsionados: %', v_total;
    
    IF v_total = 0 THEN
        RAISE NOTICE '  ⚠️ Não há animais impulsionados para testar';
        RAISE NOTICE '  💡 Crie alguns anúncios impulsionados primeiro';
    ELSE
        RAISE NOTICE '  ✅ Pronto para rotacionar % anúncios', v_total;
    END IF;
END $$;

-- Teste 3: Executar função
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM get_featured_animals_rotated_fast(10);
    
    RAISE NOTICE '';
    RAISE NOTICE '🔄 TESTE DE ROTAÇÃO:';
    RAISE NOTICE '  Resultados retornados: %', v_count;
    
    IF v_count > 0 THEN
        RAISE NOTICE '  ✅ Função executando corretamente!';
    ELSE
        RAISE NOTICE '  ⚠️ Nenhum resultado (criar anúncios impulsionados)';
    END IF;
END $$;

-- Teste 4: Mostrar ordem atual (se houver anúncios)
DO $$
DECLARE
    v_rec RECORD;
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 ORDEM ATUAL (TOP 10):';
    RAISE NOTICE '══════════════════════════════════════════════════';
    
    FOR v_rec IN 
        SELECT 
            name, 
            rotation_position,
            to_char(boosted_at, 'DD/MM HH24:MI') AS boosted_time
        FROM get_featured_animals_rotated_fast(10)
        ORDER BY rotation_position
    LOOP
        v_count := v_count + 1;
        RAISE NOTICE '  Pos %: % (impulsionado em %)', 
            LPAD(v_rec.rotation_position::TEXT, 2, ' '), 
            v_rec.name,
            v_rec.boosted_time;
    END LOOP;
    
    IF v_count = 0 THEN
        RAISE NOTICE '  (Nenhum anúncio impulsionado encontrado)';
    END IF;
    
    RAISE NOTICE '══════════════════════════════════════════════════';
END $$;

-- =====================================================
-- MENSAGEM FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ SISTEMA DE ROTAÇÃO APLICADO COM SUCESSO!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📌 FUNÇÃO CRIADA:';
    RAISE NOTICE '   get_featured_animals_rotated_fast(limite)';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 COMO USAR:';
    RAISE NOTICE '   SELECT * FROM get_featured_animals_rotated_fast(10);';
    RAISE NOTICE '';
    RAISE NOTICE '⏱️ ROTAÇÃO:';
    RAISE NOTICE '   • Muda automaticamente a cada 1 minuto';
    RAISE NOTICE '   • Distribuição 100%% equitativa';
    RAISE NOTICE '   • Máximo de 10 anúncios por vez';
    RAISE NOTICE '';
    RAISE NOTICE '📝 PRÓXIMOS PASSOS:';
    RAISE NOTICE '   1. Código frontend já está atualizado';
    RAISE NOTICE '   2. Fazer deploy do frontend';
    RAISE NOTICE '   3. Testar na página Home';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

