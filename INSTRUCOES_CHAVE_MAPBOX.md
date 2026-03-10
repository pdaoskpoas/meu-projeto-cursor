# 🗺️ INSTRUÇÕES PARA CONFIGURAR A CHAVE DO MAPBOX

## ⚠️ AÇÃO NECESSÁRIA

Para que o mapa funcione corretamente, você precisa configurar sua chave da API do Mapbox.

## 📋 Passos para Configuração

### 1. Obter a Chave da API
Você mencionou que já tem a chave da API do Mapbox. Se precisar de uma nova:
1. Acesse [mapbox.com](https://www.mapbox.com)
2. Faça login ou crie uma conta
3. Vá para "Access tokens"
4. Copie o token público (começa com `pk.`)

### 2. Configurar no Projeto
Crie um arquivo `.env` na raiz do projeto (mesmo nível do `package.json`) com:

```env
VITE_MAPBOX_ACCESS_TOKEN=SUA_CHAVE_AQUI
```

**Exemplo:**
```env
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoibWV1dXN1YXJpbyIsImEiOiJjbXh4eHh4eHgwMDAwMm1wYzl5eXl5eXl5In0.exemplo-de-token
```

### 3. Reiniciar o Servidor
Após criar o arquivo `.env`:
```bash
npm run dev
```

## 🎯 Como Testar

1. Navegue para `/map` na aplicação
2. O mapa deve carregar mostrando o globo terrestre
3. Se houver usuários cadastrados, eles aparecerão como avatares no mapa
4. Clique nos avatares para ver as informações dos usuários

## 🔧 Funcionalidades Implementadas

### ✅ Design Inspirado no FoundersAround
- Mapa com projeção de globo
- Estilo satellite-streets
- Efeitos de atmosfera espacial
- Interface moderna e responsiva

### ✅ Sistema de Usuários
- **Usuários Free**: Avatar padrão com inicial do nome
- **Usuários VIP**: Logo personalizada + coroa dourada
- Popup com informações completas
- Navegação para perfil do usuário

### ✅ Filtros e Busca
- Busca por nome ou propriedade
- Filtro por tipo de plano
- Estatísticas da comunidade em tempo real
- Interface limpa e intuitiva

### ✅ Geocodificação Automática
- Converte cidade/país em coordenadas
- Posicionamento automático dos usuários
- Pequena variação aleatória para evitar sobreposição

## 🎨 Personalização

O mapa está configurado para mostrar usuários baseados nos dados do Supabase:
- Busca usuários ativos e não suspensos
- Diferencia usuários free vs VIP
- Mostra informações da propriedade (se institucional)
- Integra com sistema de navegação existente

## 📱 Responsividade

O mapa é totalmente responsivo:
- Desktop: Sidebar com filtros + mapa grande
- Mobile: Layout empilhado com mapa adaptável
- Controles de navegação otimizados para touch

## 🚀 Próximos Passos Sugeridos

1. **Dados Reais**: Adicionar campo de localização nos perfis de usuário
2. **Clustering**: Agrupar usuários próximos para melhor performance
3. **Filtro Geográfico**: Implementar "usuários próximos a mim"
4. **Animações**: Transições suaves ao filtrar usuários

## ❓ Precisa de Ajuda?

Se tiver problemas:
1. Verifique se o arquivo `.env` está na raiz do projeto
2. Confirme se a chave da API está correta
3. Reinicie o servidor de desenvolvimento
4. Abra o console do navegador para ver possíveis erros

O mapa está pronto para uso assim que a chave da API for configurada! 🎉

