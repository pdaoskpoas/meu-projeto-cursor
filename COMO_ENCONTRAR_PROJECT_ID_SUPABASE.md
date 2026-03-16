# 🔍 Como Encontrar o Project ID do Supabase

## 📋 Passo a Passo

### 1. **Acessar o Dashboard do Supabase**

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto que você está usando

### 2. **Encontrar o Project ID**

O Project ID pode ser encontrado em **3 lugares diferentes**:

#### **Opção 1: Na URL do Dashboard** (Mais Rápido)
Quando você está no dashboard do seu projeto, a URL será algo como:
```
https://supabase.com/dashboard/project/wyufgltprapazpxmtaff
                                                      ^^^^^^^^^^^^^^^^^^^^
                                                      Este é o Project ID!
```

#### **Opção 2: Nas Configurações do Projeto**
1. No dashboard, vá em **Settings** (Configurações)
2. Clique em **General** (Geral)
3. Procure por **Reference ID** ou **Project ID**
4. Copie o valor exibido

#### **Opção 3: Na Página de API**
1. No dashboard, vá em **Settings** (Configurações)
2. Clique em **API**
3. O **Project URL** será algo como:
   ```
   https://wyufgltprapazpxmtaff.supabase.co
                      ^^^^^^^^^^^^^^^^^^^^
                      Este é o Project ID!
   ```

### 3. **Configurar o arquivo `supabase/config.toml`**

Depois de encontrar o Project ID, edite o arquivo:

```toml
project_id = "wyufgltprapazpxmtaff"  # Substitua pelo seu Project ID real
```

---

## ⚠️ IMPORTANTE

- **NÃO commite** o arquivo `supabase/config.toml` com o Project ID real no Git
- Adicione ao `.gitignore` se necessário
- Ou use variáveis de ambiente para desenvolvimento local

---

## 🔒 Alternativa Segura (Recomendada)

Se você não quer expor o Project ID no arquivo, pode usar variáveis de ambiente:

1. No arquivo `supabase/config.toml`, mantenha:
   ```toml
   project_id = "your-project-ref-here"
   ```

2. Configure localmente via variável de ambiente:
   ```bash
   export SUPABASE_PROJECT_ID="seu-project-id-aqui"
   ```

3. Ou crie um arquivo `.env.local` (que não será commitado):
   ```
   SUPABASE_PROJECT_ID=seu-project-id-aqui
   ```

---

## 📝 Exemplo Visual

```
Dashboard do Supabase
├── Settings
│   ├── General
│   │   └── Reference ID: wyufgltprapazpxmtaff  ← AQUI!
│   └── API
│       └── Project URL: https://wyufgltprapazpxmtaff.supabase.co  ← AQUI TAMBÉM!
```

---

**Dica:** O Project ID geralmente tem 20 caracteres alfanuméricos (letras minúsculas e números).
