# 🔧 Correção: Upload de Fotos e Visualização de Anúncios

## 📋 Problemas Reportados

1. **Fotos não aparecem**: Ao criar um anúncio com fotos, o sistema mostrava uma foto padrão ao invés das enviadas
2. **Página individual com erro**: Ao clicar no anúncio criado ("VVVV"), aparecia erro "Ops! Algo deu errado"

## 🔍 Análise das Causas

### Problema 1: Fotos não aparecem
**Causa Raiz**: O método `StorageService.uploadAnimalImages()` não existia!
- O código em `PublishAnimalPage.tsx` tentava chamar este método (linhas 95, 148)
- Mas o `StorageService.ts` só tinha métodos para avatars
- **Resultado**: As fotos nunca eram enviadas ao storage do Supabase

### Problema 2: Página individual com erro
**Causas Prováveis**:
1. Usuário pode não estar autenticado corretamente após criar o animal
2. Animal pode ter sido criado mas sem alguns dados obrigatórios
3. RLS policies podem estar bloqueando a visualização

**RLS Policies Verificadas**: ✅ Corretas
- Política atual permite que donos vejam seus próprios animais (mesmo pausados)
- Política atual permite que público veja apenas animais ativos

## ✅ Correções Aplicadas

### 1. Método de Upload de Imagens Criado
**Arquivo**: `src/services/storageService.ts`

Adicionado método completo para upload de imagens de animais:

```typescript
static async uploadAnimalImages(
  userId: string,
  animalId: string,
  files: File[],
  fileNames?: string[]
): Promise<string[]>
```

**Funcionalidades**:
- ✅ Upload de múltiplas imagens para o bucket `animal-images`
- ✅ Estrutura de pastas: `{userId}/{animalId}/nome_arquivo.jpg`
- ✅ Retorna URLs públicas das imagens enviadas
- ✅ Logs detalhados para debugging
- ✅ Tratamento de erros robusto

**Método Adicional**: `deleteAnimalImages()` para limpeza

### 2. Logs de Diagnóstico Adicionados
**Arquivo**: `src/pages/animal/AnimalPage.tsx`

Adicionados logs console detalhados:
- ✅ Log quando ID não é fornecido
- ✅ Log ao iniciar busca do animal
- ✅ Log quando animal não é encontrado
- ✅ Log de sucesso com detalhes (nome, status, quantidade de imagens)
- ✅ Log de erros com código e detalhes completos

## 🧪 Como Testar

### Teste 1: Upload de Fotos

1. **Criar novo anúncio**:
   - Vá em Dashboard > Meus Animais
   - Clique em "Adicionar Animal"
   - Preencha todos os campos obrigatórios
   - **IMPORTANTE**: Adicione 2-3 fotos na etapa "Fotos"
   - Complete o cadastro

2. **Verificar publicação**:
   - Você será redirecionado para página de publicação
   - Escolha publicar pelo plano OU pagar individualmente
   - Aguarde o processo finalizar

3. **Verificar fotos**:
   - Vá em Dashboard > Meus Animais
   - Encontre o animal criado
   - **Verificar**: As fotos enviadas devem aparecer (não a foto padrão)
   - Clique no animal para ver detalhes

4. **Verificar console do navegador** (F12):
   ```
   [StorageService] Uploading image 1/3: {userId}/{animalId}/image_1.jpg
   [StorageService] Upload bem-sucedido: ...
   [StorageService] Todas as 3 imagens foram enviadas com sucesso
   ```

### Teste 2: Visualização da Página Individual

1. **Criar animal e acessar página**:
   - Após criar o animal (exemplo: nome "VVVV")
   - Clique no card do animal
   - URL deve ser: `/animal/{id-do-animal}`

2. **Verificar console do navegador** (F12):
   - Se tudo OK, deve aparecer:
     ```
     [AnimalPage] Buscando animal com ID: abc123...
     [AnimalPage] Animal carregado com sucesso: {id, name: "VVVV", ...}
     ```
   
   - Se houver erro, aparecerá:
     ```
     [AnimalPage] Erro ao carregar animal: {
       id: "abc123...",
       error: "descrição do erro",
       code: "código_erro",
       details: {...}
     }
     ```

3. **Cenários possíveis**:
   - ✅ **Animal aparece normalmente**: Tudo funcionando!
   - ❌ **"Animal não encontrado"**: Verificar logs do console
   - ❌ **Erro de permissão**: Usuário pode ter sido deslogado

### Teste 3: Fluxo Completo (Recomendado)

1. **Preparação**:
   - Faça logout e login novamente (garantir sessão limpa)
   - Prepare 2-3 fotos de teste (JPG/PNG, máx 5MB cada)

2. **Criar anúncio**:
   - Dashboard > Meus Animais > Adicionar Animal
   - Nome: "Teste Upload Fotos"
   - Raça: "Mangalarga Marchador"
   - Idade/Data: Preencher
   - Sexo: Macho
   - Pelagem: Castanho
   - Categoria: Garanhão
   - Cidade/Estado: Preencher
   - **Adicionar fotos**: Upload das 2-3 fotos
   - Completar genealogia (opcional)
   - Completar extras (opcional)

3. **Publicar**:
   - Escolher forma de publicação
   - Aguardar confirmação

4. **Verificar**:
   - Dashboard > Meus Animais
   - Animal deve estar listado COM as fotos corretas
   - Clicar no animal
   - Página individual deve abrir normalmente
   - Fotos devem aparecer no carrossel

## 🐛 Possíveis Problemas e Soluções

### Problema: Fotos ainda não aparecem

**Verificar**:
1. Console do navegador (F12) para erros de upload
2. Se há erros como "bucket not found" ou "permission denied"
3. Conexão com Supabase está funcionando

**Soluções**:
- Verificar se bucket `animal-images` existe no Supabase Dashboard
- Verificar se políticas de storage estão configuradas (migration 013)
- Verificar variáveis de ambiente (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

### Problema: Página individual ainda dá erro

**Verificar no console**:
```
[AnimalPage] Erro ao carregar animal: {...}
```

**Possíveis causas**:
1. **Não autenticado**: Fazer login novamente
2. **Animal pausado + não é dono**: Esperar até publicação ativa
3. **ID inválido**: Verificar URL `/animal/{id}`
4. **RLS bloqueando**: Verificar se migration 049 foi aplicada

**Solução**:
- Se for erro de autenticação: Relogar
- Se for erro de RLS: Verificar que migrations estão aplicadas
- Se for erro de dados: Ver logs para identificar campo faltante

### Problema: Upload falha com erro de permissão

**Erro esperado**: `Permission denied` ou `Unauthorized`

**Soluções**:
1. Verificar se bucket `animal-images` existe:
   - Supabase Dashboard > Storage > Buckets
   - Deve ter bucket chamado `animal-images` marcado como público

2. Verificar policies de storage:
   - Migration `013_create_storage_bucket.sql` deve estar aplicada
   - Policies: Public Access (SELECT), Allow authenticated uploads (INSERT)

3. Recriar bucket se necessário:
   ```sql
   -- No SQL Editor do Supabase
   insert into storage.buckets (id, name, public)
   values ('animal-images', 'animal-images', true)
   ON CONFLICT DO NOTHING;
   ```

## 📊 Verificações Técnicas

### Verificar Storage Bucket
```sql
-- No SQL Editor do Supabase
SELECT * FROM storage.buckets WHERE name = 'animal-images';
```

**Resultado esperado**:
- `name`: animal-images
- `public`: true

### Verificar Policies de Storage
```sql
-- No SQL Editor do Supabase
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

**Policies esperadas**:
- Public Access (SELECT)
- Allow authenticated uploads (INSERT)
- Allow own updates (UPDATE)
- Allow own deletes (DELETE)

### Verificar RLS da tabela animals
```sql
-- No SQL Editor do Supabase
SELECT * FROM pg_policies 
WHERE tablename = 'animals' 
AND schemaname = 'public';
```

**Policy esperada**: `animals_select_unified`
- Admin vê tudo
- Dono vê seus animais (mesmo pausados)
- Público vê apenas ativos e não expirados

## 📝 Próximos Passos

1. **Testar o fluxo completo** seguindo o guia acima
2. **Verificar logs do console** para identificar possíveis erros
3. **Reportar resultados**:
   - ✅ Se funcionou: Maravilha!
   - ❌ Se ainda há erro: Copie os logs do console e envie

## 🔄 Rollback (se necessário)

Se precisar reverter as alterações:

```typescript
// src/services/storageService.ts
// Remover métodos: uploadAnimalImages() e deleteAnimalImages()
```

```typescript
// src/pages/animal/AnimalPage.tsx
// Remover logs console.log adicionados (linhas 44-68, 106-112)
```

## 📌 Resumo

### ✅ O que foi corrigido:
1. Método `uploadAnimalImages()` criado no StorageService
2. Método `deleteAnimalImages()` criado para limpeza
3. Logs de diagnóstico adicionados na AnimalPage
4. RLS policies verificadas e confirmadas como corretas

### 📋 O que fazer agora:
1. Testar criação de anúncio com fotos
2. Verificar se fotos aparecem corretamente
3. Verificar se página individual abre sem erros
4. Reportar resultados com logs do console (se houver erros)

---

**Data**: 14/11/2025
**Status**: Correções aplicadas, aguardando testes








