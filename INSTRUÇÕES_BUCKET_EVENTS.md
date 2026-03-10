# 📦 Como Criar o Bucket 'events' no Supabase

Para que o upload de imagens de eventos funcione corretamente, você precisa criar o bucket `events` no Supabase Storage.

## 🚀 Método 1: Via Supabase Studio (RECOMENDADO)

### Passo 1: Acesse o SQL Editor
1. Abra o [Supabase Studio](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **SQL Editor** (no menu lateral esquerdo)

### Passo 2: Execute o Script
1. Abra o arquivo `CREATE_EVENTS_BUCKET.sql` (na raiz do projeto)
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **"Run"** ou pressione **Ctrl+Enter**

### Passo 3: Verifique se foi criado
Após executar, você verá uma mensagem de sucesso e uma linha retornada com:
```
id: events
name: events
public: true
file_size_limit: 5242880
...
```

✅ **Pronto!** O bucket foi criado com sucesso!

---

## 🔍 Método 2: Via Interface do Storage (ALTERNATIVO)

Se preferir criar manualmente pela interface:

### Passo 1: Acesse Storage
1. Vá para **Storage** no menu lateral
2. Clique em **"New Bucket"**

### Passo 2: Configure o Bucket
- **Name:** `events`
- **Public bucket:** ✅ **Ativado**
- **File size limit:** `5 MB` (ou `5242880` bytes)
- **Allowed MIME types:** 
  ```
  image/jpeg
  image/jpg
  image/png
  image/gif
  image/webp
  ```

### Passo 3: Configure Políticas de Acesso
Após criar o bucket, vá para **Policies** e execute o script SQL para criar as políticas (disponível em `CREATE_EVENTS_BUCKET.sql`, a partir da linha 15).

---

## 🧹 Limpeza de Rascunhos Órfãos (OPCIONAL)

Se quiser limpar eventos em rascunho que ficaram órfãos (por mais de 1 hora):

```sql
DELETE FROM events 
WHERE ad_status = 'draft' 
  AND created_at < NOW() - INTERVAL '1 hour';
```

Execute este SQL no **SQL Editor** quando necessário.

---

## ✅ Verificação Final

Para verificar se tudo está funcionando:

1. Crie um novo evento
2. Adicione uma foto de capa
3. Complete o pagamento
4. Verifique se o evento aparece com a foto:
   - ✅ Na dashboard ("Meus Eventos")
   - ✅ Na página inicial ("Eventos em destaque")
   - ✅ Na página de "Eventos"

---

## 🆘 Problemas Comuns

### ❌ "Bucket not found"
**Solução:** O bucket não foi criado. Siga os passos acima.

### ❌ "Permission denied" no upload
**Solução:** As políticas não foram criadas. Execute o script completo do `CREATE_EVENTS_BUCKET.sql`.

### ❌ Imagem não aparece nos cards
**Solução:** 
1. Verifique se o bucket é público (`public: true`)
2. Verifique se a política de leitura pública foi criada
3. Limpe o cache do navegador (Ctrl+Shift+R)

---

## 📞 Suporte

Se tiver problemas, verifique:
1. ✅ O bucket `events` existe em **Storage**
2. ✅ O bucket está marcado como **público**
3. ✅ As 4 políticas foram criadas em **Storage > Policies**
4. ✅ O limite de tamanho é **5MB** ou mais

---

**Criado em:** 27/11/2024  
**Última atualização:** 27/11/2024


