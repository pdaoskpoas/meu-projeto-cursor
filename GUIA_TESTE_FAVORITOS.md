;# 🧪 Guia de Testes - Sistema de Favoritos

## ✅ Checklist de Testes Rápidos

### 1️⃣ Teste Básico - Adicionar e Recarregar
```
□ Faça login na plataforma
□ Navegue até qualquer página de animal
□ Clique no ícone de coração (♥) para favoritar
□ Observe o toast: "Animal adicionado aos favoritos"
□ Vá para Dashboard → Favoritos
□ Confirme que o animal está na lista
□ Pressione F5 (recarregar página)
□ SUCESSO: Animal continua na lista ✅
```

### 2️⃣ Teste de Múltiplos Favoritos
```
□ Navegue pela homepage ou busca
□ Favorite 4-5 animais diferentes
□ Vá para Dashboard → Favoritos
□ Confirme que todos os 4-5 animais estão listados
□ Recarregue a página (F5)
□ SUCESSO: Todos os animais continuam na lista ✅
```

### 3️⃣ Teste de Remoção
```
□ Vá para Dashboard → Favoritos
□ Clique no ícone de lixeira (🗑️) em um animal
□ Observe a animação de saída
□ Observe o toast: "Animal removido dos favoritos"
□ Recarregue a página (F5)
□ SUCESSO: Animal não reaparece ✅
```

### 4️⃣ Teste de Sincronização Entre Abas
```
□ Abra a plataforma em duas abas do navegador
□ Na aba 1: Favorite um animal
□ Na aba 2: Recarregue e vá para Favoritos
□ SUCESSO: Animal aparece na aba 2 ✅
```

### 5️⃣ Teste de Logout/Login
```
□ Favorite 2-3 animais
□ Faça logout
□ Faça login novamente (mesma conta)
□ Vá para Dashboard → Favoritos
□ SUCESSO: Favoritos estão todos lá ✅
```

### 6️⃣ Teste de Usuário Não Logado
```
□ Faça logout (ou use navegação anônima)
□ Tente clicar no coração de qualquer animal
□ SUCESSO: Redireciona para página de login ✅
```

### 7️⃣ Teste de Loading State
```
□ Faça login
□ Vá para Dashboard → Favoritos
□ Observe o spinner "Carregando seus favoritos..."
□ SUCESSO: Loading aparece antes dos favoritos ✅
```

### 8️⃣ Teste de Animal Duplicado
```
□ Favorite um animal
□ Tente favoritar o mesmo animal novamente
□ Observe o toast: "Este animal já está nos seus favoritos"
□ SUCESSO: Animal não é duplicado ✅
```

## 🔍 Verificação no Banco de Dados

Se tiver acesso ao Supabase Dashboard:

1. Acesse o Supabase Dashboard
2. Vá em **Table Editor** → `favorites`
3. Você deve ver seus favoritos com:
   - `id` (UUID do favorito)
   - `user_id` (seu ID de usuário)
   - `animal_id` (ID do animal favoritado)
   - `created_at` (data/hora de criação)

### Query SQL para Verificar:
```sql
-- Substitua 'seu-email@example.com' pelo seu email
SELECT 
  f.id,
  f.created_at,
  p.name as usuario,
  p.email,
  a.name as animal,
  a.breed as raca
FROM favorites f
JOIN profiles p ON f.user_id = p.id
JOIN animals a ON f.animal_id = a.id
WHERE p.email = 'seu-email@example.com'
ORDER BY f.created_at DESC;
```

## 🐛 Resolução de Problemas

### Problema: Favoritos não aparecem após recarregar

**Possíveis Causas:**
1. Sessão expirada - Faça login novamente
2. Erro de conexão com Supabase - Verifique console do navegador
3. Políticas RLS - Verifique se as policies estão ativas

**Solução:**
```javascript
// Abra o console do navegador (F12)
// Digite:
localStorage.clear()
// Faça login novamente
```

### Problema: Toast não aparece ao favoritar

**Verificação:**
- Abra o console do navegador (F12)
- Procure por erros em vermelho
- Envie screenshot do erro

### Problema: Erro "Usuário não autenticado"

**Solução:**
- Faça logout completo
- Limpe o cache do navegador
- Faça login novamente

## 📊 Comportamento Esperado

### Ao Adicionar Favorito:
1. ♥ fica vermelho/preenchido
2. Toast: "Animal adicionado aos favoritos"
3. Aparece na página Favoritos imediatamente
4. Persiste após recarregar

### Ao Remover Favorito:
1. ♥ fica vazio/outline
2. Toast: "Animal removido dos favoritos"
3. Desaparece da página Favoritos
4. Não reaparece após recarregar

### Estados da UI:
- **Carregando**: Spinner + "Carregando seus favoritos..."
- **Vazio**: Ícone de coração + "Nenhum animal favorito ainda"
- **Com Favoritos**: Grid com cards dos animais

## 🎯 Cenários Edge Case

### Cenário 1: Internet Lenta
```
□ Abra DevTools (F12) → Network tab
□ Throttle para "Slow 3G"
□ Tente favoritar um animal
□ ESPERADO: Loading state visível, depois sucesso
```

### Cenário 2: Animal Deletado
```
□ (Admin) Delete um animal que está nos favoritos
□ Recarregue a página de Favoritos
□ ESPERADO: Animal deletado não aparece mais
```

### Cenário 3: Múltiplos Cliques Rápidos
```
□ Clique rapidamente 3x no botão de favoritar
□ ESPERADO: Apenas 1 favorito adicionado
```

## 📝 Relatório de Bugs

Se encontrar algum problema, reporte com:

1. **Passos para Reproduzir:**
   - Lista exata do que fez

2. **Comportamento Esperado:**
   - O que deveria acontecer

3. **Comportamento Atual:**
   - O que realmente aconteceu

4. **Screenshots:**
   - Tire prints da tela e do console (F12)

5. **Informações do Sistema:**
   - Navegador e versão
   - Sistema operacional
   - Email da conta de teste

## ✨ Casos de Sucesso

Após todos os testes, você deve ser capaz de:

- ✅ Favoritar animais de qualquer página
- ✅ Ver todos os favoritos no dashboard
- ✅ Favoritos persistem após recarregar
- ✅ Favoritos persistem após logout/login
- ✅ Remover favoritos funciona corretamente
- ✅ Feedback visual imediato (toast + ícone)
- ✅ Loading state ao carregar favoritos
- ✅ Filtrar e buscar favoritos
- ✅ Ver estatísticas dos favoritos

---

**Status de Implementação:** ✅ **COMPLETO**  
**Última Atualização:** 8 de novembro de 2025


