# ⚡ CORREÇÃO IMEDIATA - FOTOS NOS ANÚNCIOS

## 🚨 PROBLEMA IDENTIFICADO

**As fotos não aparecem porque a URL do Supabase está ERRADA!**

```
❌ ATUAL: https://exemplo.supabase.co
✅ DEVE SER: https://SEU-PROJETO-REAL.supabase.co
```

---

## 🔧 CORREÇÃO (2 MINUTOS)

### Passo 1: Abrir arquivo .env

Na raiz do projeto, abra o arquivo `.env` ou `.env.local`

### Passo 2: Encontrar e Corrigir

Procure esta linha:
```bash
VITE_SUPABASE_URL=https://exemplo.supabase.co
```

### Passo 3: Como encontrar sua URL real

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie o valor de **Project URL**

Vai ser algo como:
```
https://abc123xyz.supabase.co
```

### Passo 4: Substituir no .env

```bash
# ANTES:
VITE_SUPABASE_URL=https://exemplo.supabase.co

# DEPOIS:
VITE_SUPABASE_URL=https://abc123xyz.supabase.co
```

### Passo 5: Reiniciar Servidor

```bash
# Pressione Ctrl+C para parar o servidor
# Depois reinicie:
npm run dev
```

### Passo 6: Testar

1. Recarregue a página no navegador (F5)
2. Vá em "Meus Animais"
3. **As fotos devem carregar agora!**

---

## ✅ RESULTADO ESPERADO

### ANTES (com URL errada):
- ❌ Imagens não carregam
- ❌ Erro no console: `ERR_NAME_NOT_RESOLVED @ https://exemplo.supabase.co`
- ❌ Vê apenas placeholders

### DEPOIS (com URL correta):
- ✅ Imagens carregam perfeitamente
- ✅ Nenhum erro no console
- ✅ Fotos dos animais aparecem

---

## 🔍 COMO VERIFICAR SE FUNCIONOU

1. Abra o **DevTools** (F12)
2. Vá na aba **Console**
3. **NÃO DEVE MAIS TER:** 
   ```
   Failed to load resource: net::ERR_NAME_NOT_RESOLVED @ https://exemplo.supabase.co
   ```

4. Crie um novo anúncio com foto
5. A foto deve aparecer imediatamente!

---

## ⚠️ SE AINDA NÃO FUNCIONAR

Execute no console do navegador (DevTools > Console):

```javascript
console.log(import.meta.env.VITE_SUPABASE_URL);
```

- Se ainda mostrar `exemplo.supabase.co`: o servidor não foi reiniciado corretamente
- Se mostrar a URL correta mas ainda não funciona: pode ser problema de RLS (veja próxima seção)

---

## 🔐 SE AINDA TER PROBLEMA APÓS CORRIGIR URL

Pode ser necessário aplicar as políticas RLS do storage.

Execute no Supabase SQL Editor:

```sql
-- Ver se as políticas existem:
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%animal-images%';
```

Se retornar 0 linhas, aplique a migration:
```bash
supabase_migrations/060_complete_storage_infrastructure.sql
```

---

## 📞 RESUMO

**PROBLEMA:** URL do Supabase está com valor placeholder

**SOLUÇÃO:** 
1. Editar `.env`
2. Corrigir `VITE_SUPABASE_URL` com a URL real
3. Reiniciar servidor
4. Testar

**TEMPO:** 2-5 minutos

**DIFICULDADE:** ⭐ Muito Fácil

---

**🎯 ESTA É A CAUSA DO PROBLEMA!**  
**✅ CORREÇÃO SIMPLES E RÁPIDA!**  
**🚀 APLIQUE AGORA!**








