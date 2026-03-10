# 🗑️ RELATÓRIO: DELEÇÃO DE USUÁRIOS NO SUPABASE

**Data:** 17/11/2025  
**Contexto:** Análise do que acontece quando usuários são deletados via Authentication do Supabase

---

## 📋 SUMÁRIO EXECUTIVO

Quando um usuário é deletado pelo **Supabase Authentication**, o sistema possui **políticas de CASCADE DELETE** e **SET NULL** bem definidas que determinam o destino de todos os dados relacionados.

### ✅ COMPORTAMENTO GERAL

```
auth.users (DELETADO)
    ↓
profiles (DELETADO AUTOMATICAMENTE via CASCADE)
    ↓
TODAS AS TABELAS COM FK → profiles(id)
```

---

## 🔴 DADOS QUE SÃO **DELETADOS PERMANENTEMENTE** (ON DELETE CASCADE)

### 1️⃣ **Perfil do Usuário**
```sql
profiles.id REFERENCES auth.users(id) ON DELETE CASCADE
```
- ✅ **Perfil deletado imediatamente** quando usuário é removido da autenticação
- ⚠️ Isso **aciona todas as outras cascatas** abaixo

---

### 2️⃣ **Animais e Relacionados**

#### **Tabela: `animals`**
```sql
owner_id REFERENCES profiles(id) ON DELETE CASCADE
```
- ✅ **TODOS os animais do usuário são DELETADOS**
- Inclui: nome, raça, cor, idade, preço, descrição, status, etc.

#### **Tabela: `animal_media`**
```sql
animal_id REFERENCES animals(id) ON DELETE CASCADE
```
- ✅ **TODAS as fotos/vídeos dos animais são DELETADAS**
- ⚠️ **Arquivos no Storage NÃO são deletados automaticamente!**
  - URLs ficam órfãs (precisa de limpeza manual ou trigger)

#### **Tabela: `animal_partnerships`**
```sql
animal_id REFERENCES animals(id) ON DELETE CASCADE
partner_id REFERENCES profiles(id) ON DELETE CASCADE
```
- ✅ **TODAS as sociedades são DELETADAS**
  - Sociedades onde o usuário é dono do animal
  - Sociedades onde o usuário é parceiro

---

### 3️⃣ **Sistema de Favoritos**

#### **Tabela: `favorites`**
```sql
user_id REFERENCES profiles(id) ON DELETE CASCADE
animal_id REFERENCES animals(id) ON DELETE CASCADE
```
- ✅ **TODOS os favoritos do usuário são DELETADOS**
- ✅ **Favoritos de outros usuários nos animais dele são DELETADOS** (quando animal é deletado)

---

### 4️⃣ **Sistema de Mensagens**

#### **Tabela: `conversations`**
```sql
animal_owner_id REFERENCES profiles(id) ON DELETE CASCADE
interested_user_id REFERENCES profiles(id) ON DELETE CASCADE
animal_id REFERENCES animals(id) ON DELETE CASCADE
```
- ✅ **TODAS as conversas são DELETADAS**
  - Conversas onde ele é dono do animal
  - Conversas onde ele é interessado

#### **Tabela: `messages`**
```sql
conversation_id REFERENCES conversations(id) ON DELETE CASCADE
sender_id REFERENCES profiles(id) ON DELETE CASCADE
```
- ✅ **TODAS as mensagens são DELETADAS**
  - Mensagens que ele enviou
  - **ATENÇÃO:** Conversas inteiras são apagadas para o outro usuário também!

---

### 5️⃣ **Sistema de Notificações**

#### **Tabela: `notifications`**
```sql
user_id REFERENCES profiles(id) ON DELETE CASCADE
```
- ✅ **TODAS as notificações do usuário são DELETADAS**

#### **Tabela: `notification_preferences`**
```sql
user_id REFERENCES profiles(id) ON DELETE CASCADE
```
- ✅ **Preferências de notificação são DELETADAS**

#### **Tabela: `notification_analytics`**
```sql
notification_id REFERENCES notifications(id) ON DELETE CASCADE
user_id REFERENCES profiles(id) ON DELETE CASCADE
```
- ✅ **Analytics de notificações são DELETADAS**

---

### 6️⃣ **Transações e Histórico Financeiro**

#### **Tabela: `boost_history`**
```sql
user_id REFERENCES profiles(id) ON DELETE CASCADE
```
- ✅ **TODO o histórico de boosts é DELETADO**
  - Histórico de impulsionamentos pagos
  - Datas de ativação/expiração

#### **Tabela: `transactions`**
```sql
user_id REFERENCES profiles(id) ON DELETE CASCADE
```
- ✅ **TODAS as transações são DELETADAS**
  - Pagamentos de planos
  - Pagamentos de boosts
  - **⚠️ PROBLEMA FISCAL:** Perda de registros contábeis!

---

### 7️⃣ **Sistema de Suspensões**

#### **Tabela: `suspensions`**
```sql
user_id REFERENCES profiles(id) ON DELETE CASCADE
```
- ✅ **Histórico de suspensões é DELETADO**
  - Se o usuário foi suspenso, o registro desaparece

---

## 🟡 DADOS QUE SÃO **PRESERVADOS** (ON DELETE SET NULL)

### 1️⃣ **Analytics e Métricas**

#### **Tabela: `impressions`**
```sql
user_id REFERENCES profiles(id) ON DELETE SET NULL
```
- ✅ **Impressões são PRESERVADAS**, mas `user_id` vira `NULL`
- ℹ️ Mantém estatísticas agregadas (total de views, etc.)

#### **Tabela: `clicks`**
```sql
user_id REFERENCES profiles(id) ON DELETE SET NULL
```
- ✅ **Cliques são PRESERVADOS**, mas `user_id` vira `NULL`
- ℹ️ Mantém estatísticas agregadas (total de cliques, etc.)

---

### 2️⃣ **Sistema de Denúncias**

#### **Tabela: `reports`**
```sql
reporter_id REFERENCES profiles(id) ON DELETE SET NULL
reported_user_id REFERENCES profiles(id) ON DELETE SET NULL
admin_id REFERENCES profiles(id) ON DELETE SET NULL
```
- ✅ **Denúncias são PRESERVADAS** para auditoria
- ℹ️ IDs são substituídos por NULL, mas textos (nomes, emails) permanecem

---

### 3️⃣ **Conteúdo Criado (Patrocinadores)**

#### **Tabela: `sponsors`**
```sql
created_by REFERENCES profiles(id) ON DELETE SET NULL
```
- ✅ **Patrocinadores criados são PRESERVADOS**
- ℹ️ Sistema mantém funcionando, apenas perde rastreamento de quem criou

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 🔴 **CRÍTICO: Transações Financeiras**

```sql
❌ transactions → ON DELETE CASCADE
```

**Problema:**
- Quando usuário é deletado, **todo histórico de pagamentos é apagado**
- **Violação fiscal:** precisa manter registros contábeis por 5 anos (Brasil)
- **Sem auditoria:** impossível rastrear receitas passadas

**Solução Recomendada:**
```sql
-- Mudar para SET NULL + adicionar campos de backup
ALTER TABLE transactions
DROP CONSTRAINT transactions_user_id_fkey;

ALTER TABLE transactions
ADD CONSTRAINT transactions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE SET NULL;

-- Adicionar campos para preservar informações essenciais
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS user_email_backup TEXT,
ADD COLUMN IF NOT EXISTS user_name_backup TEXT,
ADD COLUMN IF NOT EXISTS user_cpf_backup TEXT;
```

---

### 🟡 **ALTO: Mensagens em Conversas**

```sql
❌ conversations → ON DELETE CASCADE
❌ messages → ON DELETE CASCADE (via conversation)
```

**Problema:**
- Quando usuário é deletado, **conversas COMPLETAS desaparecem**
- O **outro usuário perde TODO o histórico de mensagens**
- Não é o comportamento esperado em apps modernos (WhatsApp, Telegram mantêm mensagens)

**Solução Recomendada:**
```sql
-- Conversas devem ser preservadas
ALTER TABLE conversations
DROP CONSTRAINT conversations_animal_owner_id_fkey,
DROP CONSTRAINT conversations_interested_user_id_fkey;

ALTER TABLE conversations
ADD CONSTRAINT conversations_animal_owner_id_fkey
FOREIGN KEY (animal_owner_id) REFERENCES profiles(id)
ON DELETE SET NULL,

ADD CONSTRAINT conversations_interested_user_id_fkey
FOREIGN KEY (interested_user_id) REFERENCES profiles(id)
ON DELETE SET NULL;

-- Mensagens devem ser preservadas
ALTER TABLE messages
DROP CONSTRAINT messages_sender_id_fkey;

ALTER TABLE messages
ADD CONSTRAINT messages_sender_id_fkey
FOREIGN KEY (sender_id) REFERENCES profiles(id)
ON DELETE SET NULL;

-- Adicionar campos de backup
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS sender_name_backup TEXT,
ADD COLUMN IF NOT EXISTS deleted_user BOOLEAN DEFAULT FALSE;
```

---

### 🟡 **MÉDIO: Arquivos no Storage**

**Problema:**
- Quando `animal_media` é deletado, **URLs ficam órfãs no Storage**
- **Storage não limpa automaticamente** (custo crescente)
- Arquivos ocupam espaço e geram custo sem estarem vinculados a nada

**Solução Recomendada:**

```sql
-- Criar trigger para deletar arquivos do Storage
CREATE OR REPLACE FUNCTION delete_animal_media_files()
RETURNS TRIGGER AS $$
BEGIN
  -- Extrair path do arquivo da URL
  -- Chamar função para deletar do Supabase Storage
  -- (implementação depende da estrutura das URLs)
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER before_delete_animal_media
BEFORE DELETE ON animal_media
FOR EACH ROW
EXECUTE FUNCTION delete_animal_media_files();
```

---

### 🟢 **BAIXO: Histórico de Suspensões**

```sql
❌ suspensions → ON DELETE CASCADE
```

**Problema:**
- Perda de histórico de moderação
- Impossível rastrear padrões de usuários problemáticos

**Solução Recomendada:**
```sql
ALTER TABLE suspensions
DROP CONSTRAINT suspensions_user_id_fkey;

ALTER TABLE suspensions
ADD CONSTRAINT suspensions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE SET NULL;
```

---

## 📊 RESUMO: O QUE ACONTECEU QUANDO VOCÊ DELETOU OS 2 USUÁRIOS

### ✅ **Dados DELETADOS Permanentemente:**

1. ✅ Perfis dos 2 usuários
2. ✅ Todos os animais cadastrados por eles
3. ✅ Todas as fotos/vídeos dos animais
4. ✅ Todas as sociedades (como donos ou parceiros)
5. ✅ Todos os favoritos (deles e de outros nos animais deles)
6. ✅ Todas as conversas (incluindo as dos outros usuários com eles!)
7. ✅ Todas as mensagens (incluindo as recebidas por outros!)
8. ✅ Todas as notificações
9. ✅ Todo histórico de boosts
10. ✅ **Todas as transações financeiras** ⚠️
11. ✅ Histórico de suspensões

### ✅ **Dados PRESERVADOS (com user_id = NULL):**

1. ✅ Impressões/visualizações (métricas agregadas)
2. ✅ Cliques (métricas agregadas)
3. ✅ Denúncias feitas por eles ou contra eles
4. ✅ Patrocinadores criados

### ⚠️ **Arquivos Órfãos:**

- ❌ Fotos/vídeos no Storage continuam ocupando espaço
- ❌ **Precisa limpeza manual** ou implementar trigger

---

## 🚀 RECOMENDAÇÕES URGENTES

### 1. **FISCAL: Preservar Transações**
```sql
-- URGENTE: Alterar CASCADE para SET NULL em transactions
-- Script em: scripts/fix_transactions_cascade.sql
```

### 2. **UX: Preservar Mensagens**
```sql
-- IMPORTANTE: Alterar CASCADE para SET NULL em conversations/messages
-- Script em: scripts/fix_messages_cascade.sql
```

### 3. **CUSTO: Implementar Limpeza de Storage**
```sql
-- IMPORTANTE: Criar trigger para deletar arquivos do Storage
-- Script em: scripts/storage_cleanup_trigger.sql
```

### 4. **AUDITORIA: Preservar Suspensões**
```sql
-- RECOMENDADO: Alterar CASCADE para SET NULL em suspensions
-- Script em: scripts/fix_suspensions_cascade.sql
```

---

## 📝 CHECKLIST PÓS-DELEÇÃO

Quando deletar usuários no futuro, verificar:

- [ ] Exportar transações financeiras para backup contábil
- [ ] Notificar outros usuários sobre conversas que serão perdidas
- [ ] Executar script de limpeza de Storage manualmente
- [ ] Verificar se há animais em sociedade (parceiros perdem acesso)
- [ ] Confirmar se há boosts ativos (serão perdidos)
- [ ] Backup de dados críticos antes da deleção

---

## 🎯 CONCLUSÃO

O sistema atual **está funcionando conforme configurado**, mas possui **decisões de design problemáticas** que podem causar:

1. **Problemas fiscais** (perda de histórico de pagamentos)
2. **Má experiência de usuário** (outros usuários perdem conversas)
3. **Custos desnecessários** (arquivos órfãos no Storage)
4. **Perda de auditoria** (histórico de moderação apagado)

**Recomendação:** Aplicar os scripts de correção ANTES de deletar mais usuários.

---

**Gerado em:** 17/11/2025  
**Status:** ⚠️ AÇÃO NECESSÁRIA

