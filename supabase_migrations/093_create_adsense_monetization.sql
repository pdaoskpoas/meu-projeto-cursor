-- =====================================================
-- MIGRATION 093: Sistema de Monetização com Google AdSense
-- Data: 2025-12-XX
-- Descrição: Cria tabela para armazenar configurações de anúncios do Google AdSense
--            Apenas para área de notícias (/noticias e /noticias/[slug])
-- =====================================================

-- Tabela para configurações de monetização AdSense
CREATE TABLE IF NOT EXISTS adsense_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Script global do AdSense (carregado apenas uma vez por página)
  global_script TEXT,
  
  -- Códigos HTML/JS dos anúncios
  listing_banner TEXT,        -- Banner para página de listagem (/noticias)
  article_top_banner TEXT,    -- Banner início do artigo
  article_mid_banner TEXT,    -- Banner meio do artigo
  article_bottom_banner TEXT, -- Banner final do artigo
  
  -- Status e controle
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida de configuração ativa
CREATE INDEX IF NOT EXISTS idx_adsense_config_active 
ON adsense_config(is_active) 
WHERE is_active = TRUE;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_adsense_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_adsense_config_updated_at
BEFORE UPDATE ON adsense_config
FOR EACH ROW
EXECUTE FUNCTION update_adsense_config_updated_at();

-- Trigger para garantir apenas uma configuração ativa
-- Quando uma configuração é marcada como ativa, desativa todas as outras
CREATE OR REPLACE FUNCTION ensure_single_active_adsense_config()
RETURNS TRIGGER AS $$
BEGIN
  -- Se está marcando como ativo, desativar outras configurações
  IF NEW.is_active = TRUE AND (OLD.is_active IS NULL OR OLD.is_active = FALSE) THEN
    UPDATE adsense_config
    SET is_active = FALSE
    WHERE id != NEW.id
      AND is_active = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_active_adsense_config
BEFORE INSERT OR UPDATE ON adsense_config
FOR EACH ROW
WHEN (NEW.is_active = TRUE)
EXECUTE FUNCTION ensure_single_active_adsense_config();

-- RLS Policies
ALTER TABLE adsense_config ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem ler configurações
CREATE POLICY "Admins can read adsense config"
ON adsense_config
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política: Apenas admins podem inserir configurações
CREATE POLICY "Admins can insert adsense config"
ON adsense_config
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política: Apenas admins podem atualizar configurações
CREATE POLICY "Admins can update adsense config"
ON adsense_config
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política: Apenas admins podem deletar configurações
CREATE POLICY "Admins can delete adsense config"
ON adsense_config
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política: Usuários não autenticados podem ler configuração ativa (para exibir anúncios)
CREATE POLICY "Public can read active adsense config"
ON adsense_config
FOR SELECT
TO anon, authenticated
USING (is_active = TRUE);

-- Comentários
COMMENT ON TABLE adsense_config IS 
'Tabela para armazenar configurações de monetização com Google AdSense.
Os anúncios são exibidos APENAS nas páginas de notícias (/noticias e /noticias/[slug]).';

COMMENT ON COLUMN adsense_config.global_script IS 
'Script global do Google AdSense. Deve ser carregado apenas uma vez por página.';

COMMENT ON COLUMN adsense_config.listing_banner IS 
'Código HTML/JS do banner para página de listagem de notícias (/noticias)';

COMMENT ON COLUMN adsense_config.article_top_banner IS 
'Código HTML/JS do banner no início do conteúdo do artigo';

COMMENT ON COLUMN adsense_config.article_mid_banner IS 
'Código HTML/JS do banner no meio do conteúdo do artigo';

COMMENT ON COLUMN adsense_config.article_bottom_banner IS 
'Código HTML/JS do banner no final do conteúdo do artigo';
