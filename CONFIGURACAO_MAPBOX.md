# Configuração do Mapbox para o Mapa da Comunidade

## Visão Geral

O mapa da comunidade foi implementado usando o Mapbox GL JS, seguindo o design e funcionalidade do site FoundersAround.com. O mapa exibe todos os usuários cadastrados na plataforma com diferentes tipos de avatares baseados no plano de assinatura.

## Funcionalidades Implementadas

### ✅ Mapa Interativo
- Mapa mundial com projeção de globo (similar ao FoundersAround)
- Estilo satellite-streets para melhor visualização
- Controles de navegação (zoom, rotação)
- Efeitos de fog e atmosfera espacial

### ✅ Sistema de Avatares
- **Usuários Free**: Avatar padrão com inicial do nome em gradiente azul
- **Usuários VIP**: Logo personalizada (avatar_url) + coroa dourada
- Efeitos hover com escala e sombra
- Posicionamento baseado em geocodificação de cidade/país

### ✅ Popup de Informações
- Design moderno com gradientes e sombras
- Informações do usuário: nome, propriedade, tipo, plano
- Instagram handle simulado
- Botão "Ver Perfil Completo" que navega para o perfil
- Badge VIP para usuários premium

### ✅ Filtros e Busca
- Busca por nome ou propriedade
- Filtro por estado (preparado para expansão)
- Filtro por tipo de plano (free, basic, pro, ultra, vip)
- Estatísticas em tempo real da comunidade

## Configuração da API do Mapbox

### 1. Obter Chave da API
1. Acesse [mapbox.com](https://www.mapbox.com)
2. Crie uma conta ou faça login
3. Vá para a seção "Access tokens"
4. Copie seu token público (começa com `pk.`)

### 2. Configurar Variável de Ambiente
Crie um arquivo `.env` na raiz do projeto com:

```env
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbXh4eHh4eHgwMDAwMm1wYzl5eXl5eXl5In0.your-token-here
```

### 3. Atualizar o Componente (se necessário)
O token é automaticamente carregado no componente `MapboxMap.tsx`:

```typescript
const MAPBOX_ACCESS_TOKEN = process.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiY2F2YWxhcmlhZGlnaXRhbCIsImEiOiJjbTJwdGNyZGcwMDNiMmxzY2k5ZDVzMGFzIn0.example';
```

## Arquivos Criados/Modificados

### Novos Componentes
- `src/components/MapboxMap.tsx` - Componente principal do mapa
- `src/components/UserMapPopup.tsx` - Popup de informações do usuário

### Páginas Modificadas
- `src/pages/MapPage.tsx` - Página do mapa completamente redesenhada

### Dependências Adicionadas
- `mapbox-gl` - Biblioteca principal do Mapbox
- `@types/mapbox-gl` - Tipos TypeScript

## Como Usar

### 1. Navegar para o Mapa
Acesse `/map` na aplicação para ver o mapa da comunidade.

### 2. Interagir com Usuários
- Clique em qualquer avatar no mapa para ver informações
- Use os filtros na sidebar para encontrar usuários específicos
- Clique em "Ver Perfil Completo" para navegar para o perfil

### 3. Filtrar Usuários
- **Busca**: Digite nome ou propriedade na caixa de busca
- **Estado**: Selecione um estado específico (funcionalidade preparada)
- **Plano**: Filtre por tipo de assinatura (free, basic, pro, ultra, vip)

## Geocodificação

O sistema usa a API de geocodificação do Mapbox para converter nomes de cidades em coordenadas:

```typescript
const geocodeLocation = async (location: string): Promise<[number, number] | null> => {
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`
  );
  // ... processamento
};
```

## Personalização

### Alterar Estilo do Mapa
No componente `MapboxMap.tsx`, linha ~75:
```typescript
style: 'mapbox://styles/mapbox/satellite-streets-v12'
```

Estilos disponíveis:
- `mapbox://styles/mapbox/streets-v12`
- `mapbox://styles/mapbox/outdoors-v12`
- `mapbox://styles/mapbox/light-v11`
- `mapbox://styles/mapbox/dark-v11`
- `mapbox://styles/mapbox/satellite-v9`
- `mapbox://styles/mapbox/satellite-streets-v12`

### Personalizar Avatares
Modifique a função `createMarkerElement` no `MapboxMap.tsx` para alterar:
- Tamanho dos avatares (atualmente 50px)
- Cores dos gradientes
- Efeitos hover
- Posição da coroa VIP

### Ajustar Centro do Mapa
Atualmente centrado no Brasil:
```typescript
center: [-54.5, -15.5], // Centro do Brasil
zoom: 4,
```

## Próximos Passos

### Melhorias Sugeridas
1. **Clustering**: Agrupar usuários próximos em clusters
2. **Filtro por Localização**: Implementar filtro real por estado/região
3. **Busca Geográfica**: "Mostrar usuários próximos a mim"
4. **Animações**: Transições suaves ao adicionar/remover marcadores
5. **Modo Offline**: Cache de tiles para uso offline
6. **Heatmap**: Visualização de densidade de usuários

### Otimizações
1. **Lazy Loading**: Carregar marcadores sob demanda
2. **Virtualização**: Renderizar apenas marcadores visíveis
3. **Debounce**: Otimizar filtros com debounce
4. **Caching**: Cache de geocodificação

## Troubleshooting

### Mapa não carrega
1. Verifique se a chave da API está correta
2. Verifique se a variável de ambiente está configurada
3. Abra o console do navegador para ver erros

### Marcadores não aparecem
1. Verifique se há usuários na base de dados
2. Verifique se a geocodificação está funcionando
3. Verifique se os filtros não estão muito restritivos

### Performance lenta
1. Reduza o número de usuários exibidos
2. Implemente clustering
3. Use debounce nos filtros

## Suporte

Para questões técnicas sobre o Mapbox, consulte:
- [Documentação oficial](https://docs.mapbox.com/)
- [Exemplos de código](https://docs.mapbox.com/mapbox-gl-js/examples/)
- [API Reference](https://docs.mapbox.com/mapbox-gl-js/api/)

