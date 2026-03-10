# 🚀 PASSO A PASSO: Aplicar Correção de Upload de Fotos

## ✅ STATUS ATUAL

### Correções no Código (Já Aplicadas)
- ✅ Função `base64ToFile` corrigida (sem violar CSP)
- ✅ Fluxo de conversão File → Base64 → File funcionando
- ✅ StorageService configurado corretamente

### Correção Pendente (CRÍTICA)
- ❌ **Políticas RLS do bucket animal-images** (VOCÊ PRECISA APLICAR)

## 📋 INSTRUÇÕES PASSO A PASSO

### 📍 PASSO 1: Acessar Supabase Dashboard

1. Abra seu navegador
2. Vá para: https://supabase.com/dashboard
3. Faça login na sua conta
4. Selecione seu projeto

### 📍 PASSO 2: Abrir SQL Editor

1. No menu lateral esquerdo, procure por **"SQL Editor"**
2. Clique em **"SQL Editor"**
3. Clique em **"+ New query"** (botão verde no canto superior direito)

### 📍 PASSO 3: Copiar o Script SQL

1. Abra o arquivo **`CORRECAO_STORAGE_ANIMAL_IMAGES.sql`** (na raiz do projeto)
2. Selecione TODO o conteúdo (Ctrl+A)
3. Copie (Ctrl+C)

**OU** copie este código aqui:

```sql
-- ============================================================================
-- CORREÇÃO CRÍTICA: Políticas RLS para Upload de Imagens de Animais
-- ============================================================================

-- 1. Permitir INSERT (upload) para usuários autenticados nas suas próprias pastas
CREATE POLICY "Usuários podem fazer upload das próprias imagens de animais"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'animal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Permitir SELECT (visualização) pública de todas as imagens
CREATE POLICY "Imagens de animais são publicamente visíveis"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'animal-images');

-- 3. Permitir UPDATE (atualização) para o proprietário
CREATE POLICY "Usuários podem atualizar suas próprias imagens"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'animal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'animal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Permitir DELETE (exclusão) para o proprietário
CREATE POLICY "Usuários podem deletar suas próprias imagens"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'animal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 📍 PASSO 4: Colar e Executar

1. Cole o código copiado no SQL Editor (Ctrl+V)
2. Clique no botão **"Run"** (ou pressione Ctrl+Enter)
3. Aguarde a mensagem de **"Success"** aparecer

**Resultado esperado:** Você deve ver uma mensagem verde de sucesso.

### 📍 PASSO 5: Verificar Políticas Criadas

Execute esta query para confirmar:

```sql
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%animais%'
ORDER BY policyname;
```

**Resultado esperado:** 4 linhas (4 políticas)

## 🧪 TESTE COMPLETO

Agora que as políticas estão aplicadas, vamos testar:

### Teste 1: Criar Animal com Fotos

1. **Recarregue** a aplicação (F5)
2. Faça **login** se necessário
3. Clique em **"Adicionar Animal"**
4. Preencha os dados obrigatórios:
   - Nome: "Teste Upload Fotos Funcional"
   - Raça: Qualquer raça
   - Idade: 5 anos
   - Gênero: Macho ou Fêmea
   - Pelagem: Qualquer cor
   - Categoria: Qualquer
5. Clique em **"Próximo"**
6. Preencha a localização:
   - Cidade: "São Paulo"
   - Estado: "SP"
7. Clique em **"Próximo"**
8. **ADICIONE 2-3 FOTOS** (arraste ou clique)
9. Aguarde a mensagem **"Imagens adicionadas"**
10. Clique em **"Próximo"** até a última etapa
11. Clique em **"Finalizar"**
12. Na página de publicação, clique em **"Publicar Agora"**

### Teste 2: Verificar se Funcionou

**No navegador:**
1. O animal deve aparecer na lista
2. **AS FOTOS DEVEM APARECER NO CARD** (não mais a imagem padrão)

**No Supabase Dashboard (SQL Editor):**

```sql
-- Verificar se as URLs foram salvas
SELECT 
  id, 
  name, 
  images,
  jsonb_array_length(COALESCE(images, '[]'::jsonb)) as num_images
FROM animals
WHERE name = 'Teste Upload Fotos Funcional'
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado:** 
- `images` deve ter um array com URLs
- `num_images` deve ser > 0 (ex: 2 ou 3)

**Verificar arquivos no storage:**

```sql
SELECT 
  name,
  created_at,
  bucket_id
FROM storage.objects
WHERE bucket_id = 'animal-images'
ORDER BY created_at DESC
LIMIT 10;
```

**Resultado esperado:** Você deve ver os arquivos recém-enviados!

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Políticas RLS aplicadas no Supabase Dashboard
- [ ] Query de verificação retornou 4 políticas
- [ ] Aplicação recarregada (F5)
- [ ] Novo animal criado com fotos
- [ ] Fotos aparecem no card do animal (não imagem padrão)
- [ ] Coluna `images` no banco tem URLs
- [ ] Arquivos visíveis em `storage.objects`

## ❗ SE ALGO DER ERRADO

### Erro: "permission denied for bucket animal-images"
**Solução:** As políticas não foram aplicadas. Execute o SQL novamente.

### Erro: "Failed to fetch" ou "CSP violation"
**Solução:** Já foi corrigido no código. Recarregue a página (F5).

### Fotos ainda não aparecem
**Solução:** 
1. Verifique se as políticas foram aplicadas (Passo 5)
2. Abra o Console do navegador (F12) e procure por erros
3. Verifique a aba Network (F12 > Network) e filtre por "storage"

## 📊 LOGS PARA DEBUG

Se precisar enviar logs para análise, copie estes dados:

### Console do navegador:
```
F12 > Console > Copie mensagens que começam com:
- [AddAnimalWizard]
- [PublishAnimal]
- [StorageService]
```

### Network do navegador:
```
F12 > Network > Filtre por "storage" > 
Clique na requisição > Headers > Copie Status Code e Response
```

### SQL para verificar situação atual:
```sql
-- Animais recentes
SELECT id, name, images, created_at 
FROM animals 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Arquivos no storage
SELECT name, created_at, bucket_id
FROM storage.objects
WHERE bucket_id = 'animal-images'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Políticas RLS
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND bucket_id = 'animal-images';
```

## 🎉 SUCESSO!

Quando tudo funcionar:
- ✅ Fotos enviadas aparecem nos cards
- ✅ Não há mais imagens padrão
- ✅ URLs salvas no banco de dados
- ✅ Arquivos visíveis no storage

---

**Me avise quando você terminar de aplicar as políticas e fazer o teste!** 🚀








