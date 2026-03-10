-- =====================================================
-- VERIFICAÇÃO: ANIMAIS E FAVORITOS NO SISTEMA
-- Data: 8 de novembro de 2025
-- Objetivo: Verificar animais ativos e sistema de favoritos
-- =====================================================

-- 1. Contar animais por status
SELECT 
  ad_status,
  COUNT(*) as total
FROM animals
GROUP BY ad_status
ORDER BY total DESC;

-- 2. Listar animais ATIVOS (visíveis ao público)
SELECT 
  id,
  name,
  breed,
  ad_status,
  haras_name,
  current_city,
  current_state,
  published_at,
  expires_at,
  CASE 
    WHEN expires_at IS NULL THEN 'SEM EXPIRAÇÃO'
    WHEN expires_at > CURRENT_TIMESTAMP THEN 'ATIVO'
    ELSE 'EXPIRADO'
  END as status_real
FROM animals
WHERE ad_status = 'active'
  AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
ORDER BY published_at DESC NULLS LAST
LIMIT 10;

-- 3. Verificar animais expirados mas ainda marcados como 'active'
SELECT 
  id,
  name,
  ad_status,
  expires_at,
  CURRENT_TIMESTAMP as agora,
  (expires_at - CURRENT_TIMESTAMP) as tempo_restante
FROM animals
WHERE ad_status = 'active' 
  AND expires_at IS NOT NULL
  AND expires_at < CURRENT_TIMESTAMP
LIMIT 10;

-- 4. Contar favoritos por status do animal
SELECT 
  COALESCE(a.ad_status, 'ANIMAL DELETADO') as status_animal,
  COUNT(*) as total_favoritos
FROM favorites f
LEFT JOIN animals a ON f.animal_id = a.id
GROUP BY a.ad_status
ORDER BY total_favoritos DESC;

-- 5. Ver favoritos com detalhes completos
SELECT 
  f.id as favorito_id,
  f.created_at as favoritado_em,
  p.name as usuario,
  p.email as usuario_email,
  a.id as animal_id,
  a.name as animal_nome,
  a.breed as raca,
  a.ad_status as status,
  a.haras_name as haras
FROM favorites f
JOIN profiles p ON f.user_id = p.id
LEFT JOIN animals a ON f.animal_id = a.id
ORDER BY f.created_at DESC
LIMIT 20;

-- 6. Verificar favoritos órfãos (animal deletado)
SELECT 
  f.id as favorito_id,
  f.user_id,
  f.animal_id,
  'ANIMAL NÃO EXISTE MAIS' as problema
FROM favorites f
WHERE NOT EXISTS (
  SELECT 1 FROM animals a WHERE a.id = f.animal_id
);

-- 7. Verificar favoritos de animais inativos
SELECT 
  f.id as favorito_id,
  f.user_id,
  f.animal_id,
  a.name as animal_nome,
  a.ad_status as status,
  a.expires_at,
  CASE 
    WHEN a.ad_status != 'active' THEN 'STATUS INATIVO'
    WHEN a.expires_at < CURRENT_TIMESTAMP THEN 'EXPIRADO'
    ELSE 'OK'
  END as problema
FROM favorites f
JOIN animals a ON f.animal_id = a.id
WHERE a.ad_status != 'active'
   OR (a.expires_at IS NOT NULL AND a.expires_at < CURRENT_TIMESTAMP);

-- 8. Verificar perfis de usuários (haras)
SELECT 
  id,
  name,
  account_type,
  property_name,
  property_type,
  email
FROM profiles
WHERE account_type = 'institutional'
LIMIT 10;

-- =====================================================
-- COMANDOS DE MANUTENÇÃO (SE NECESSÁRIO)
-- =====================================================

-- Limpar favoritos de animais deletados
/*
DELETE FROM favorites
WHERE animal_id NOT IN (SELECT id FROM animals);
*/

-- Limpar favoritos de animais inativos (CUIDADO!)
/*
DELETE FROM favorites f
USING animals a
WHERE f.animal_id = a.id
  AND (a.ad_status != 'active' 
       OR (a.expires_at IS NOT NULL AND a.expires_at < CURRENT_TIMESTAMP));
*/

-- =====================================================
-- CRIAR ANIMAL DE TESTE (SE NECESSÁRIO)
-- =====================================================

/*
-- Buscar um usuário existente
SELECT id, name, email FROM profiles LIMIT 1;

-- Criar animal de teste
INSERT INTO animals (
  name,
  breed,
  gender,
  coat,
  birth_date,
  owner_id,
  haras_id,
  haras_name,
  ad_status,
  published_at,
  current_city,
  current_state,
  expires_at
) VALUES (
  'Cavalo Teste Favoritos',
  'Mangalarga Marchador',
  'Macho',
  'Alazão',
  '2020-01-01',
  (SELECT id FROM profiles WHERE account_type = 'institutional' LIMIT 1),
  (SELECT id FROM profiles WHERE account_type = 'institutional' LIMIT 1),
  (SELECT property_name FROM profiles WHERE account_type = 'institutional' LIMIT 1),
  'active',
  NOW(),
  'São Paulo',
  'SP',
  NOW() + INTERVAL '30 days'
) RETURNING id, name, ad_status;
*/

-- =====================================================
-- VERIFICAR POLÍTICAS RLS
-- =====================================================

-- Ver políticas da tabela animals
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'animals'
ORDER BY policyname;

-- Ver políticas da tabela favorites
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'favorites'
ORDER BY policyname;


