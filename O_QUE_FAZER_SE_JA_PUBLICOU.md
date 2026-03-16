# ⚠️ O QUE FAZER SE VOCÊ JÁ PUBLICOU O CÓDIGO ANTES

## 🔍 Situação Atual

Se você já commitou/publicou o código com o `project_id` do Supabase exposto, aqui está o que você precisa saber e fazer:

---

## 📊 Nível de Risco

### ✅ **Risco BAIXO - Project ID**
O `project_id` do Supabase **NÃO é uma chave secreta**. Ele é:
- ✅ Público por natureza (aparece nas URLs da API)
- ✅ Usado em requisições do frontend
- ✅ Visível nas requisições de rede do navegador
- ⚠️ **MAS:** Combinado com outras informações, pode ser usado para identificar seu projeto

### 🔴 **Risco ALTO - Chaves Secretas**
Se você expôs:
- ❌ `SUPABASE_SERVICE_ROLE_KEY` (chave de serviço)
- ❌ `ASAAS_API_KEY` (chave da API do Asaas)
- ❌ Tokens de acesso reais (não exemplos)

**AÇÃO IMEDIATA:** Revogar e gerar novas chaves!

---

## 🛡️ AÇÕES RECOMENDADAS

### 1. **Verificar o Histórico do Git**

Verifique se o `project_id` está no histórico:

```bash
# Verificar histórico do arquivo
git log --all --full-history -- supabase/config.toml

# Verificar se está em algum commit
git log --all -S "wyufgltprapazpxmtaff" --source --all
```

### 2. **Se o Código Está em Repositório Público**

#### **Opção A: Remover do Histórico (Recomendado para Repos Públicos)**

Se o repositório é público e você quer remover completamente:

```bash
# ⚠️ CUIDADO: Isso reescreve o histórico do Git!
# Faça backup antes!

# Usar git filter-branch ou BFG Repo-Cleaner
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch supabase/config.toml" \
  --prune-empty --tag-name-filter cat -- --all

# Ou usar BFG (mais fácil):
# bfg --replace-text passwords.txt supabase/config.toml
```

#### **Opção B: Adicionar ao .gitignore (Mais Simples)**

Se o repositório é privado ou você não se importa que o project_id fique no histórico:

1. Adicione ao `.gitignore`:
   ```
   supabase/config.toml
   ```

2. Crie um arquivo de exemplo:
   ```bash
   cp supabase/config.toml supabase/config.toml.example
   # Edite o .example removendo o project_id real
   ```

3. Commit a mudança:
   ```bash
   git add .gitignore supabase/config.toml.example
   git commit -m "chore: adicionar config.toml ao .gitignore"
   ```

### 3. **Se o Código Está em Repositório Privado**

- ✅ Risco menor, mas ainda recomendado adicionar ao `.gitignore`
- ✅ Criar arquivo de exemplo
- ✅ Documentar que o arquivo deve ser configurado localmente

---

## 🔒 BOAS PRÁTICAS PARA O FUTURO

### 1. **Criar `.gitignore` Adequado**

Certifique-se de que seu `.gitignore` inclui:

```gitignore
# Supabase
supabase/config.toml
supabase/.env

# Variáveis de ambiente
.env
.env.local
.env.*.local

# Chaves e credenciais
*.key
*.pem
secrets/
```

### 2. **Usar Arquivos de Exemplo**

Sempre crie arquivos `.example` para configurações:

```bash
supabase/config.toml.example
.env.example
```

### 3. **Usar Variáveis de Ambiente**

Para dados sensíveis, prefira variáveis de ambiente:

```toml
# supabase/config.toml
project_id = "${SUPABASE_PROJECT_ID}"
```

### 4. **Verificar Antes de Commitar**

Use ferramentas para detectar credenciais:

```bash
# Instalar git-secrets
git secrets --install
git secrets --register-aws

# Ou usar truffleHog
trufflehog git file://./
```

---

## 📋 CHECKLIST DE AÇÃO IMEDIATA

- [ ] Verificar se o repositório é público ou privado
- [ ] Verificar histórico do Git para ver o que foi exposto
- [ ] Adicionar `supabase/config.toml` ao `.gitignore`
- [ ] Criar `supabase/config.toml.example` com placeholder
- [ ] Se repositório público: considerar remover do histórico
- [ ] Verificar se outras chaves secretas foram expostas
- [ ] Se sim: revogar e gerar novas chaves imediatamente
- [ ] Documentar processo de configuração local

---

## ⚠️ SE VOCÊ EXPÔS CHAVES SECRETAS

Se você expôs chaves secretas (não apenas o project_id):

### **AÇÃO IMEDIATA:**

1. **Supabase:**
   - Dashboard → Settings → API
   - Revogar `service_role` key exposta
   - Gerar nova chave

2. **Asaas:**
   - Dashboard → Configurações → API
   - Revogar chave exposta
   - Gerar nova chave

3. **Mapbox:**
   - Dashboard → Access Tokens
   - Revogar token exposto
   - Gerar novo token

4. **Atualizar Variáveis de Ambiente:**
   - Atualizar `.env.local` com novas chaves
   - Atualizar variáveis de ambiente de produção

---

## ✅ CONCLUSÃO

**Para o `project_id` especificamente:**
- ✅ Não é crítico (é informação semi-pública)
- ✅ Mas é boa prática não expor
- ✅ Adicione ao `.gitignore` e use arquivo de exemplo

**Para chaves secretas:**
- 🔴 **CRÍTICO** - Revogar imediatamente se expostas
- 🔴 Gerar novas chaves
- 🔴 Atualizar todas as variáveis de ambiente

---

**Lembre-se:** O importante é prevenir futuras exposições e corrigir o que já foi exposto!
