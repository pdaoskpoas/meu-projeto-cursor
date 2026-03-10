# 🚀 GUIA RÁPIDO - SISTEMA DE PATROCÍNIO

## 📍 Onde Acessar

```
Painel Admin → Menu Lateral → "Patrocínio" (ícone de prédio 🏢)
```

---

## ➕ Adicionar Patrocinador (Passo a Passo)

1. **Clique em "Adicionar Patrocinador"**

2. **Preencha os dados:**
   - ✅ **Nome** (obrigatório): Ex: "Rações Premium Ltda"
   - 📝 **Descrição** (opcional): "Empresa líder em nutrição equina"
   - 🔗 **Website** (opcional): https://racoespremium.com.br
   - 🖼️ **Logo** (obrigatório): Faça upload da imagem
   - 🎚️ **Prioridade** (opcional): 10 (maior número aparece primeiro)
   - 📅 **Datas** (opcional): Agendar início/fim da campanha
   - ☑️ **Ativar**: Marque para exibir imediatamente

3. **Clique em "Criar Patrocinador"**

4. **Pronto!** O logo já aparece na home em "Empresas que confiam"

---

## ✏️ Editar Patrocinador

1. Encontre o patrocinador na lista
2. Clique no botão **✏️ Editar**
3. Modifique as informações
4. Upload novo logo (se quiser trocar)
5. Clique em **"Atualizar Patrocinador"**

---

## 👁️ Ativar/Desativar

- **Desativar**: Clique no botão "Desativar" → Logo desaparece da home
- **Ativar**: Clique no botão "Ativar" → Logo volta a aparecer

> **Dica:** Use isso quando um patrocinador estiver "em pausa" mas você não quer deletar

---

## 🗑️ Deletar Patrocinador

1. Clique no botão **🗑️ Deletar**
2. Confirme a ação
3. ⚠️ **Atenção:** Isso remove permanentemente o patrocinador e seus logos

---

## 📊 Entendendo as Estatísticas

### No topo da página:

- **Ativos**: Quantos patrocinadores estão sendo exibidos agora
- **Impressões Totais**: Quantas vezes a seção foi visualizada
- **Cliques Totais**: Quantas vezes os logos foram clicados

### Em cada patrocinador:

- **👁️ 42**: Este patrocinador teve 42 visualizações
- **👆 8**: Este patrocinador teve 8 cliques
- **Taxa implícita**: 8 cliques / 42 visualizações = 19% de engajamento

---

## 🎯 Casos de Uso Comuns

### 1. **Patrocinador novo entrando:**
```
✅ Adicionar novo patrocinador → Upload logo → Ativar
```

### 2. **Patrocinador saindo:**
```
✅ Desativar patrocinador (se pode voltar no futuro)
OU
✅ Deletar patrocinador (se não volta mais)
```

### 3. **Trocar logo de patrocinador:**
```
✅ Editar patrocinador → Upload novo logo → Atualizar
```

### 4. **Campanha temporária (3 meses):**
```
✅ Criar patrocinador
✅ Definir "Data de Início": 01/01/2025
✅ Definir "Data de Fim": 31/03/2025
✅ Ativar
→ Sistema ativa e desativa automaticamente nas datas
```

### 5. **Patrocinador VIP (sempre no topo):**
```
✅ Criar/Editar patrocinador
✅ Definir "Prioridade": 100 (valor alto)
→ Sempre aparece primeiro no carrossel
```

---

## ⚠️ Dicas Importantes

1. **Logo sem fundo**: Use PNG com fundo transparente para melhor resultado
2. **Tamanho recomendado**: 800x800px ou proporcional
3. **Formato**: PNG, JPG ou WEBP (até 5MB)
4. **Prioridade**: Numere de 1 a 100 (100 = máxima prioridade)
5. **Website**: Sempre comece com `https://` ou `http://`
6. **Teste na home**: Após adicionar, acesse a home e role até "Empresas que confiam"

---

## 🔍 Verificações Rápidas

| Problema | Solução |
|----------|---------|
| Logo não aparece na home | Verifique se o patrocinador está **ativado** |
| Imagem muito grande | Sistema comprime automaticamente, mas evite imagens > 5MB |
| Clique não abre website | Verifique se o website está correto (com https://) |
| Patrocinador sumiu da home | Verifique se passou da "Data de Fim" da campanha |
| Não consigo editar | Verifique se você é administrador |

---

## 🎨 Como Fica na Home

```
┌────────────────────────────────────────┐
│  🏆 Empresas que confiam na            │
│     Vitrine do Cavalo                  │
│                                        │
│  [Logo 1] [Logo 2] [Logo 3] [Logo 4] →│
│  ← Carrossel infinito →                │
│                                        │
│  (Passe o mouse para pausar)           │
└────────────────────────────────────────┘
```

- **Carrossel infinito**: Logos rolam continuamente
- **Hover para pausar**: Mouse em cima pausa a animação
- **Clicável**: Clicar abre o website do patrocinador
- **Responsivo**: Adapta para mobile/tablet/desktop

---

## 📋 Resumo de Permissões

| Ação | Quem Pode |
|------|-----------|
| Ver painel de patrocínio | Apenas admins |
| Adicionar patrocinador | Apenas admins |
| Editar patrocinador | Apenas admins |
| Ativar/desativar | Apenas admins |
| Deletar patrocinador | Apenas admins |
| Ver logos na home | Todos (público) |
| Clicar em logos | Todos (público) |

---

## 🆘 Suporte

Se algo não estiver funcionando:

1. ✅ Verifique se você é administrador
2. ✅ Limpe o cache do navegador (Ctrl+Shift+R)
3. ✅ Verifique o console do navegador (F12 → Console)
4. ✅ Confirme que a migration 060 foi aplicada no Supabase
5. ✅ Verifique se o bucket `sponsor-logos` existe no Supabase Storage

---

**🎉 Pronto! Seu sistema de patrocínio está completo e funcional!**

Agora você tem controle total sobre os logos exibidos na home, pode gerenciar campanhas, acompanhar analytics e trocar patrocinadores de forma rápida e visual. 🚀








