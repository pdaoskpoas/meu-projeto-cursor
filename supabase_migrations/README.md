# 🗄️ MIGRAÇÕES SUPABASE - CAVALARIA DIGITAL

Este diretório contém todas as migrações SQL para configurar o banco de dados do sistema Cavalaria Digital no Supabase.

## 📋 ORDEM DE EXECUÇÃO

Execute as migrações **EXATAMENTE** nesta ordem no Supabase Dashboard:

### 1️⃣ **001_create_extensions_and_profiles.sql**
- Extensões necessárias (uuid-ossp, pgcrypto)
- Tabela `profiles` (usuários)
- Índices básicos

### 2️⃣ **002_create_suspensions_and_animals.sql**
- Tabela `suspensions` (suspensões de usuários)
- Tabela `animals` (animais cadastrados)
- Índices para performance

### 3️⃣ **003_create_media_and_partnerships.sql**
- Tabela `animal_media` (fotos/vídeos)
- Tabela `animal_partnerships` (sociedades)
- Relacionamentos e índices

### 4️⃣ **004_create_events_and_articles.sql**
- Tabela `events` (eventos)
- Tabela `articles` (notícias/artigos)
- Índices específicos

### 5️⃣ **005_create_analytics_system.sql**
- Tabela `impressions` (visualizações)
- Tabela `clicks` (cliques)
- Sistema completo de analytics

### 6️⃣ **006_create_favorites_and_messaging.sql**
- Tabela `favorites` (favoritos)
- Tabela `conversations` (conversas)
- Tabela `messages` (mensagens)

### 7️⃣ **007_create_boost_and_transactions.sql**
- Tabela `boost_history` (histórico de boosts)
- Tabela `transactions` (transações financeiras)
- Preparação para Stripe

### 8️⃣ **008_create_triggers_and_functions.sql**
- Triggers para `updated_at`
- Funções auxiliares (códigos públicos, expiração)
- Automações do sistema

### 9️⃣ **009_create_rls_policies.sql**
- Row Level Security (RLS) para todas as tabelas
- Políticas de permissão detalhadas
- Segurança completa

### 🔟 **010_create_views_and_final_setup.sql**
- Views com estatísticas
- Função de busca avançada
- Configurações finais

---

## 🚀 COMO EXECUTAR

### No Supabase Dashboard:

1. Acesse **SQL Editor** no painel do Supabase
2. Para cada arquivo, na ordem:
   - Copie todo o conteúdo do arquivo
   - Cole no SQL Editor
   - Clique em **Run** (▶️)
   - Aguarde confirmação de sucesso
   - Prossiga para o próximo arquivo

### Verificação:

Após executar todas as migrações, execute este comando para verificar:

```sql
-- Verificar se todas as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Deve retornar:
-- animal_media
-- animal_partnerships
-- animals
-- articles
-- boost_history
-- clicks
-- conversations
-- events
-- favorites
-- impressions
-- messages
-- profiles
-- suspensions
-- transactions
```

---

## 📊 ESTRUTURA DO BANCO

### 👥 **USUÁRIOS E AUTENTICAÇÃO**
- `profiles` - Perfis de usuários (estende auth.users)
- `suspensions` - Histórico de suspensões

### 🐎 **ANIMAIS E CONTEÚDO**
- `animals` - Animais cadastrados
- `animal_media` - Fotos e vídeos
- `animal_partnerships` - Sociedades entre usuários
- `events` - Eventos
- `articles` - Notícias e artigos

### 📈 **ANALYTICS**
- `impressions` - Visualizações (quando aparece na tela)
- `clicks` - Cliques (quando usuário interage)

### 💬 **COMUNICAÇÃO**
- `conversations` - Conversas entre usuários
- `messages` - Mensagens das conversas
- `favorites` - Animais favoritados

### 💰 **FINANCEIRO E BOOST**
- `boost_history` - Histórico de impulsionamentos
- `transactions` - Transações financeiras (Stripe)

---

## 🔐 SEGURANÇA (RLS)

Todas as tabelas têm **Row Level Security** habilitado com políticas específicas:

- **Usuários** podem ver/editar apenas seus próprios dados
- **Sócios** compartilham acesso aos animais em parceria
- **Admins** têm acesso completo (exceto dados sensíveis)
- **Visitantes** veem apenas conteúdo público ativo

---

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

### ✅ **Sistema de Planos**
- Free: 0 anúncios, 0 boosts
- Basic: 10 anúncios, 0 boosts
- Pro: 15 anúncios, 3 boosts/mês
- Ultra: 30 anúncios, 5 boosts/mês
- VIP: Benefícios do Pro, 0 boosts (admin)

### ✅ **Sistema de Analytics**
- Impressões por viewport (só conta se aparecer na tela)
- Cliques rastreados por sessão
- Métricas compartilhadas em sociedades
- Visibilidade controlada por permissões

### ✅ **Sistema de Boost**
- Duração de 24h
- Serve para animais OU eventos
- Histórico completo
- Reset mensal automático

### ✅ **Expiração Automática**
- Anúncios expiram em 30 dias
- Boosts expiram automaticamente
- Planos têm controle de validade

### ✅ **Busca Avançada**
- Filtros por raça, localização, gênero
- Ordenação: ranking, recentes, mais vistos
- Boosted sempre aparecem primeiro
- Performance otimizada

---

## 🔧 MANUTENÇÃO

### Funções Automáticas:
- `reset_monthly_boosts()` - Reseta boosts mensais
- `expire_boosts()` - Expira boosts automaticamente  
- `expire_ads()` - Expira anúncios automaticamente

### Executar Periodicamente:
```sql
-- Executar diariamente (pode ser automatizado)
SELECT reset_monthly_boosts();
SELECT expire_boosts();
SELECT expire_ads();
```

---

## 📝 NOTAS IMPORTANTES

1. **Ordem é CRÍTICA** - Execute exatamente na sequência
2. **Backup** - Sempre faça backup antes de executar
3. **Teste** - Execute primeiro em ambiente de desenvolvimento
4. **Monitoramento** - Acompanhe logs durante execução
5. **Rollback** - Tenha plano de rollback se necessário

---

**Data de Criação:** 30 de Setembro de 2025  
**Versão:** 1.0  
**Compatibilidade:** Supabase PostgreSQL 15+





