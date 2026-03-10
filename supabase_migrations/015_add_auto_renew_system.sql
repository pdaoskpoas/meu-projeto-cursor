-- Adicionar sistema de renovação automática para anúncios
-- 1. Campo auto_renew na tabela animals
-- 2. Lógica de renovação automática no processamento
-- 3. Verificação de plano válido ou cobrança individual

-- Adicionar coluna auto_renew à tabela animals
ALTER TABLE animals 
ADD COLUMN auto_renew BOOLEAN DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN animals.auto_renew IS 'Se o anúncio deve ser renovado automaticamente após 30 dias (se usuário tiver plano válido ou aceitar cobrança)';

-- Atualizar função de processamento de expirações para incluir renovação automática
CREATE OR REPLACE FUNCTION process_animal_expirations()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER := 0;
  renewed_count INTEGER := 0;
  deleted_count INTEGER := 0;
  animal_record RECORD;
  user_profile RECORD;
  allowed_animals INTEGER;
  active_animals INTEGER;
BEGIN
  -- 1. Processar anúncios que expiraram (1 mês após publicação)
  FOR animal_record IN 
    SELECT a.*, p.plan, p.plan_expires_at, p.is_annual_plan
    FROM animals a
    JOIN profiles p ON a.owner_id = p.id
    WHERE a.ad_status = 'active' 
      AND a.expires_at < now()
      AND a.expires_at IS NOT NULL
  LOOP
    -- Se auto_renew está habilitado, tentar renovar
    IF animal_record.auto_renew = true THEN
      -- Verificar se usuário ainda tem plano válido
      IF animal_record.plan IS NOT NULL 
         AND animal_record.plan != 'free' 
         AND (animal_record.plan_expires_at IS NULL OR animal_record.plan_expires_at > now()) THEN
        
        -- Verificar se ainda tem cota disponível no plano
        SELECT COUNT(*) INTO active_animals
        FROM animals 
        WHERE owner_id = animal_record.owner_id 
          AND ad_status = 'active'
          AND id != animal_record.id; -- Excluir o animal atual da contagem
        
        -- Calcular limite do plano
        allowed_animals := CASE animal_record.plan
          WHEN 'basic' THEN 10
          WHEN 'pro' THEN 15
          WHEN 'ultra' THEN 30
          WHEN 'vip' THEN 15
          ELSE 0
        END;
        
        -- Se ainda tem cota disponível, renovar pelo plano
        IF active_animals < allowed_animals THEN
          UPDATE animals 
          SET published_at = now(),
              expires_at = now() + interval '1 month'
          WHERE id = animal_record.id;
          
          renewed_count := renewed_count + 1;
          
          -- Log da renovação automática
          INSERT INTO system_logs (operation, details, created_at)
          VALUES (
            'animal_auto_renewed_by_plan',
            json_build_object(
              'animal_id', animal_record.id,
              'owner_id', animal_record.owner_id,
              'plan', animal_record.plan,
              'renewed_at', now()
            ),
            now()
          );
          
          CONTINUE; -- Pular para próximo animal
        END IF;
      END IF;
      
      -- Se chegou aqui, não conseguiu renovar pelo plano
      -- Marcar como expirado mas manter auto_renew para possível cobrança individual
      UPDATE animals 
      SET ad_status = 'expired'
      WHERE id = animal_record.id;
      
      expired_count := expired_count + 1;
      
      -- Log da expiração (aguardando renovação individual)
      INSERT INTO system_logs (operation, details, created_at)
      VALUES (
        'animal_expired_awaiting_renewal',
        json_build_object(
          'animal_id', animal_record.id,
          'owner_id', animal_record.owner_id,
          'auto_renew', true,
          'reason', 'plan_quota_exceeded_or_expired',
          'expired_at', now()
        ),
        now()
      );
    ELSE
      -- auto_renew = false, simplesmente expirar
      UPDATE animals 
      SET ad_status = 'expired'
      WHERE id = animal_record.id;
      
      expired_count := expired_count + 1;
      
      -- Log da expiração normal
      INSERT INTO system_logs (operation, details, created_at)
      VALUES (
        'animal_expired_no_renewal',
        json_build_object(
          'animal_id', animal_record.id,
          'owner_id', animal_record.owner_id,
          'auto_renew', false,
          'expired_at', now()
        ),
        now()
      );
    END IF;
  END LOOP;
  
  -- 2. Deletar anúncios que estão expirados há mais de 7 dias
  -- (período de graça terminou)
  DELETE FROM animals
  WHERE ad_status = 'expired'
    AND expires_at < now() - interval '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log final das operações
  INSERT INTO system_logs (operation, details, created_at)
  VALUES (
    'animal_expiration_process_summary',
    json_build_object(
      'expired_count', expired_count,
      'renewed_count', renewed_count,
      'deleted_count', deleted_count,
      'processed_at', now()
    ),
    now()
  );
  
  RETURN expired_count + renewed_count + deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para renovar anúncio individualmente (chamada quando usuário paga)
CREATE OR REPLACE FUNCTION renew_animal_individually(animal_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  animal_exists BOOLEAN;
BEGIN
  -- Verificar se o animal existe e pertence ao usuário
  SELECT EXISTS(
    SELECT 1 FROM animals 
    WHERE id = animal_id_param 
      AND owner_id = user_id_param 
      AND ad_status = 'expired'
  ) INTO animal_exists;
  
  IF NOT animal_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Renovar o anúncio
  UPDATE animals 
  SET ad_status = 'active',
      published_at = now(),
      expires_at = now() + interval '1 month'
  WHERE id = animal_id_param;
  
  -- Log da renovação individual
  INSERT INTO system_logs (operation, details, created_at)
  VALUES (
    'animal_renewed_individually',
    json_build_object(
      'animal_id', animal_id_param,
      'user_id', user_id_param,
      'renewed_at', now()
    ),
    now()
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Criar índice para performance da nova coluna
CREATE INDEX IF NOT EXISTS idx_animals_auto_renew ON animals (auto_renew) WHERE auto_renew = true;

-- Comentários para documentação
COMMENT ON FUNCTION process_animal_expirations() IS 'Processa expirações com renovação automática: renova pelo plano se possível, senão marca como expired aguardando pagamento individual';
COMMENT ON FUNCTION renew_animal_individually(UUID, UUID) IS 'Renova anúncio individualmente após pagamento - usado quando auto_renew=true mas sem plano válido';
COMMENT ON COLUMN animals.auto_renew IS 'Se true, tenta renovar automaticamente: pelo plano (se válido) ou aguarda pagamento individual';





