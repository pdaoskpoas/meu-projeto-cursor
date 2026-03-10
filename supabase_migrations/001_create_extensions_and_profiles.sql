-- =====================================================
-- MIGRAÇÃO 001: EXTENSÕES E TABELA DE PERFIS
-- Data: 30/09/2025
-- Descrição: Criar extensões necessárias e tabela de perfis de usuários
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABELA DE PERFIS (USUÁRIOS)
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informações básicas
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  cpf TEXT UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  
  -- Tipo de conta
  account_type TEXT CHECK (account_type IN ('personal', 'institutional')) DEFAULT 'personal',
  property_name TEXT, -- Nome do haras/fazenda
  property_type TEXT CHECK (property_type IN ('haras', 'fazenda', 'cte', 'central-reproducao')),
  property_id TEXT, -- ID da propriedade (mesmo que user ID para institucional)
  public_code TEXT UNIQUE, -- Código público único
  
  -- Plano e assinatura
  plan TEXT CHECK (plan IN ('free', 'basic', 'pro', 'ultra', 'vip')) DEFAULT 'free',
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  plan_purchased_at TIMESTAMP WITH TIME ZONE,
  is_annual_plan BOOLEAN DEFAULT FALSE,
  
  -- Boosts disponíveis
  available_boosts INTEGER DEFAULT 0,
  boosts_reset_at TIMESTAMP WITH TIME ZONE DEFAULT DATE_TRUNC('month', NOW() + INTERVAL '1 month'),
  
  -- Status e permissões
  role TEXT CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  is_suspended BOOLEAN DEFAULT FALSE,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_cpf ON profiles(cpf);
CREATE INDEX idx_profiles_public_code ON profiles(public_code);
CREATE INDEX idx_profiles_plan ON profiles(plan);
CREATE INDEX idx_profiles_account_type ON profiles(account_type);

-- Comentários para documentação
COMMENT ON TABLE profiles IS 'Perfis de usuários do sistema - estende auth.users do Supabase';
COMMENT ON COLUMN profiles.account_type IS 'Tipo de conta: personal (usuário simples) ou institutional (haras/fazenda/cte)';
COMMENT ON COLUMN profiles.property_type IS 'Tipo de propriedade para contas institucionais';
COMMENT ON COLUMN profiles.public_code IS 'Código público único para identificação do usuário/haras';
COMMENT ON COLUMN profiles.plan IS 'Plano atual do usuário: free, basic, pro, ultra, vip';
COMMENT ON COLUMN profiles.available_boosts IS 'Quantidade de boosts disponíveis no mês atual';





