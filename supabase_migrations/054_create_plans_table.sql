-- =====================================================
-- MIGRAÇÃO 054: SISTEMA DE PLANOS
-- Data: 08 de Novembro de 2025
-- Descrição: Criar tabela de planos para substituir dados mockados
-- =====================================================

-- =====================================================
-- CRIAR TABELA DE PLANOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações básicas
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL, -- Nome amigável para exibição
  description TEXT,
  
  -- Precificação
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  duration INTEGER DEFAULT 1, -- em meses, 0 = ilimitado/vitalício
  
  -- Recursos do plano
  features JSONB DEFAULT '[]'::jsonb,
  
  -- Limites
  max_animals INTEGER, -- NULL = ilimitado
  max_events INTEGER, -- NULL = ilimitado
  available_boosts INTEGER DEFAULT 0, -- Boosts gratuitos por mês
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE, -- Destacar na página de planos
  
  -- Ordem de exibição
  display_order INTEGER DEFAULT 0,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_plans_name ON plans(name);
CREATE INDEX idx_plans_is_active ON plans(is_active);
CREATE INDEX idx_plans_display_order ON plans(display_order);

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE plans IS 'Planos de assinatura disponíveis no sistema';
COMMENT ON COLUMN plans.name IS 'Nome único do plano (identificador interno): free, basic, pro, ultra, vip';
COMMENT ON COLUMN plans.display_name IS 'Nome amigável para exibição no frontend';
COMMENT ON COLUMN plans.features IS 'Array JSON com lista de recursos do plano';
COMMENT ON COLUMN plans.duration IS 'Duração em meses. 0 = ilimitado/vitalício';
COMMENT ON COLUMN plans.available_boosts IS 'Quantidade de boosts gratuitos inclusos no plano por mês';

-- =====================================================
-- POPULAR COM PLANOS ATUAIS
-- =====================================================

-- =====================================================
-- VALORES REAIS DOS PLANOS (baseado em usePlansData.ts)
-- =====================================================
-- Plano Iniciante: R$ 97,00/mês (anual: R$ 76,21/mês)
-- Plano Pro: R$ 147,00/mês (anual: R$ 120,27/mês)  
-- Plano Elite: R$ 247,00/mês (anual: R$ 192,11/mês)
-- =====================================================

INSERT INTO plans (
  name, 
  display_name,
  description,
  price, 
  duration, 
  features, 
  max_animals,
  max_events,
  available_boosts,
  is_active,
  is_featured,
  display_order
) VALUES 
(
  'free',
  'Gratuito',
  'Plano básico para começar (não exibido na página de planos)',
  0.00,
  0,
  '["Perfil básico", "Visualização limitada", "Suporte por email"]'::jsonb,
  1, -- 1 animal apenas
  0, -- sem eventos
  0, -- sem boosts
  false, -- não ativo para venda
  false,
  1
),
(
  'basic',
  'Plano Iniciante',
  'Plano ideal para criadores iniciantes',
  97.00, -- Preço mensal com desconto
  1, -- mensal
  '["Mantenha até 10 anúncios ativos simultaneamente", "Aparece no mapa interativo", "Perfil completo com link para Instagram", "Relatórios de visualização", "Suporte por e-mail e tickets", "Economize 45% no plano anual"]'::jsonb,
  10, -- 10 anúncios
  5, -- eventos
  0, -- sem boosts mensais gratuitos
  true,
  false,
  2
),
(
  'pro',
  'Plano Pro',
  'Para criadores profissionais',
  147.00, -- Preço mensal com desconto
  1, -- mensal
  '["Mantenha até 15 anúncios ativos simultaneamente", "1 turbinada grátis por mês (cumulativa)", "Destaque PREMIUM nos resultados", "Aparece no topo do mapa interativo", "Perfil verificado com selo premium", "Link para Instagram e WhatsApp", "Relatórios detalhados de performance", "Suporte prioritário por WhatsApp", "Sistema de sociedades", "Economize 55% no plano anual"]'::jsonb,
  15, -- 15 anúncios
  10, -- eventos
  1, -- 1 boost mensal gratuito (renovado mensalmente, cumulativo)
  true,
  true, -- plano popular
  3
),
(
  'ultra',
  'Plano Elite',
  'Máximo poder para seu negócio',
  247.00, -- Preço mensal com desconto
  1, -- mensal
  '["Mantenha até 25 anúncios ativos simultaneamente", "2 turbinadas grátis por mês (cumulativas)", "Máxima visibilidade e destaque", "Posição privilegiada no mapa", "Perfil premium com múltiplos contatos", "Integração completa com redes sociais", "Analytics avançados e insights", "Suporte VIP dedicado", "Sistema completo de sociedades", "Consultoria de marketing digital", "Economize 65% no plano anual"]'::jsonb,
  25, -- 25 anúncios
  15, -- eventos
  2, -- 2 boosts mensais gratuitos (renovados mensalmente, cumulativos)
  true,
  false,
  4
),
(
  'vip',
  'VIP',
  'Plano cortesia concedido pelo administrador',
  0.00, -- gratuito (concedido pelo admin)
  0, -- ilimitado (não expira)
  '["Mesmos limites do Plano Pro", "15 anúncios ativos simultaneamente", "10 eventos simultaneamente", "Concedido gratuitamente pelo administrador", "NÃO recebe turbinadas mensais gratuitas", "Pode comprar turbinadas individuais", "Suporte premium dedicado"]'::jsonb,
  15, -- MESMOS limites do Pro (15 anúncios)
  10, -- MESMOS limites do Pro (10 eventos)
  0, -- NÃO recebe boosts mensais gratuitos (diferente do Pro)
  true,
  false,
  5
);

-- =====================================================
-- ADICIONAR VARIANTE ANUAL DOS PLANOS (OPCIONAL)
-- Se quiser ter planos separados para mensal/anual
-- =====================================================

-- Plano Iniciante Anual
INSERT INTO plans (
  name, 
  display_name,
  description,
  price, 
  duration, 
  features, 
  max_animals,
  max_events,
  available_boosts,
  is_active,
  is_featured,
  display_order
) VALUES 
(
  'basic_annual',
  'Plano Iniciante (Anual)',
  'Plano ideal para criadores iniciantes - Pagamento anual com desconto',
  76.21, -- Valor da parcela mensal no plano anual
  12, -- 12 meses
  '["Mantenha até 10 anúncios ativos simultaneamente", "Aparece no mapa interativo", "Perfil completo com link para Instagram", "Relatórios de visualização", "Suporte por e-mail e tickets", "✨ Economize 45% (R$ 914,52/ano)"]'::jsonb,
  10, -- 10 anúncios
  5, -- eventos
  0, -- sem boosts mensais gratuitos
  true,
  false,
  6
),
(
  'pro_annual',
  'Plano Pro (Anual)',
  'Para criadores profissionais - Pagamento anual com desconto',
  120.27, -- Valor da parcela mensal no plano anual
  12, -- 12 meses
  '["Mantenha até 15 anúncios ativos simultaneamente", "1 turbinada grátis por mês (cumulativa)", "Destaque PREMIUM nos resultados", "Aparece no topo do mapa interativo", "Perfil verificado com selo premium", "Link para Instagram e WhatsApp", "Relatórios detalhados de performance", "Suporte prioritário por WhatsApp", "Sistema de sociedades", "✨ Economize 55% (R$ 1.443,24/ano)"]'::jsonb,
  15, -- 15 anúncios
  10, -- eventos
  1, -- 1 boost mensal gratuito (renovado mensalmente, cumulativo)
  true,
  true, -- plano popular
  7
),
(
  'ultra_annual',
  'Plano Elite (Anual)',
  'Máximo poder para seu negócio - Pagamento anual com desconto',
  192.11, -- Valor da parcela mensal no plano anual
  12, -- 12 meses
  '["Mantenha até 25 anúncios ativos simultaneamente", "2 turbinadas grátis por mês (cumulativas)", "Máxima visibilidade e destaque", "Posição privilegiada no mapa", "Perfil premium com múltiplos contatos", "Integração completa com redes sociais", "Analytics avançados e insights", "Suporte VIP dedicado", "Sistema completo de sociedades", "Consultoria de marketing digital", "✨ Economize 65% (R$ 2.305,32/ano)"]'::jsonb,
  25, -- 25 anúncios
  15, -- eventos
  2, -- 2 boosts mensais gratuitos (renovados mensalmente, cumulativos)
  true,
  false,
  8
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Todos podem visualizar planos ativos
CREATE POLICY "Plans are viewable by everyone" 
ON plans FOR SELECT 
USING (is_active = true);

-- Apenas admins podem gerenciar planos
CREATE POLICY "Only admins can manage plans" 
ON plans FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_plans_updated_at();

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON plans TO authenticated;
GRANT ALL ON plans TO authenticated; -- RLS vai controlar quem pode fazer o quê

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar planos criados
SELECT 
  name,
  display_name,
  price,
  duration,
  max_animals,
  is_active,
  is_featured,
  display_order
FROM plans
ORDER BY display_order;

-- Resultado esperado: 8 planos
-- 1. free (não ativo para venda)
-- 2. basic (R$ 97,00 mensal)
-- 3. pro (R$ 147,00 mensal) - popular
-- 4. ultra (R$ 247,00 mensal)
-- 5. vip (gratuito - admin)
-- 6. basic_annual (R$ 76,21/mês por 12 meses)
-- 7. pro_annual (R$ 120,27/mês por 12 meses) - popular
-- 8. ultra_annual (R$ 192,11/mês por 12 meses)

