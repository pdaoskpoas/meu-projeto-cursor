-- =====================================================
-- MIGRAÇÃO 008: TRIGGERS E FUNÇÕES
-- Data: 30/09/2025
-- Descrição: Criar triggers para updated_at e funções auxiliares
-- =====================================================

-- =====================================================
-- FUNÇÃO PARA ATUALIZAR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_animals_updated_at 
    BEFORE UPDATE ON animals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at 
    BEFORE UPDATE ON articles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_animal_partnerships_updated_at 
    BEFORE UPDATE ON animal_partnerships 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÃO PARA GERAR CÓDIGO PÚBLICO
-- =====================================================
CREATE OR REPLACE FUNCTION generate_public_code(user_id_param UUID, account_type_param TEXT)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    user_code TEXT;
    year_suffix TEXT;
    result TEXT;
BEGIN
    -- Definir prefixo baseado no tipo de conta
    IF account_type_param = 'institutional' THEN
        prefix := 'H'; -- Haras
    ELSE
        prefix := 'U'; -- User
    END IF;
    
    -- Pegar últimos 6 caracteres do UUID (sem hífens)
    user_code := UPPER(REPLACE(SUBSTRING(user_id_param::TEXT FROM 32 FOR 6), '-', ''));
    
    -- Pegar últimos 2 dígitos do ano atual
    year_suffix := SUBSTRING(EXTRACT(YEAR FROM NOW())::TEXT FROM 3 FOR 2);
    
    -- Montar código final
    result := prefix || user_code || year_suffix;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO PARA RESETAR BOOSTS MENSALMENTE
-- =====================================================
CREATE OR REPLACE FUNCTION reset_monthly_boosts()
RETURNS void AS $$
BEGIN
    UPDATE profiles 
    SET 
        available_boosts = CASE 
            WHEN plan = 'pro' THEN 3
            WHEN plan = 'ultra' THEN 5
            ELSE 0
        END,
        boosts_reset_at = DATE_TRUNC('month', NOW() + INTERVAL '1 month')
    WHERE 
        plan IN ('pro', 'ultra') 
        AND (plan_expires_at IS NULL OR plan_expires_at > NOW())
        AND boosts_reset_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO PARA EXPIRAR BOOSTS AUTOMATICAMENTE
-- =====================================================
CREATE OR REPLACE FUNCTION expire_boosts()
RETURNS void AS $$
BEGIN
    -- Desativar boosts expirados
    UPDATE boost_history 
    SET is_active = FALSE 
    WHERE expires_at <= NOW() AND is_active = TRUE;
    
    -- Atualizar status de boost nos animais
    UPDATE animals 
    SET 
        is_boosted = FALSE,
        boost_expires_at = NULL
    WHERE 
        is_boosted = TRUE 
        AND boost_expires_at <= NOW();
    
    -- Atualizar status de boost nos eventos
    UPDATE events 
    SET 
        is_boosted = FALSE,
        boost_expires_at = NULL
    WHERE 
        is_boosted = TRUE 
        AND boost_expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO PARA EXPIRAR ANÚNCIOS
-- =====================================================
CREATE OR REPLACE FUNCTION expire_ads()
RETURNS void AS $$
BEGIN
    -- Pausar animais expirados
    UPDATE animals 
    SET ad_status = 'expired'
    WHERE 
        ad_status = 'active' 
        AND expires_at <= NOW();
    
    -- Pausar eventos expirados
    UPDATE events 
    SET ad_status = 'expired'
    WHERE 
        ad_status = 'active' 
        AND expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON FUNCTION update_updated_at_column() IS 'Função trigger para atualizar automaticamente o campo updated_at';
COMMENT ON FUNCTION generate_public_code(UUID, TEXT) IS 'Gera código público único para usuários (formato: H123ABC25 ou U123ABC25)';
COMMENT ON FUNCTION reset_monthly_boosts() IS 'Reseta boosts mensais para usuários com planos ativos';
COMMENT ON FUNCTION expire_boosts() IS 'Expira boosts automaticamente e atualiza status dos anúncios';
COMMENT ON FUNCTION expire_ads() IS 'Expira anúncios automaticamente após 30 dias';





