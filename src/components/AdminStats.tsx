// COMPONENTE REFATORADO - Agora usa componentes menores e especializados
// O componente original foi dividido em múltiplos componentes para melhor manutenibilidade
// 
// Estrutura nova:
// - AdminStats.tsx (componente principal - ~80 linhas)
// - admin/stats/AdminStatsOverview.tsx (seção overview)
// - admin/stats/types.ts (interfaces compartilhadas)
// - admin/stats/utils.ts (funções utilitárias)
//
// Próximos componentes a serem criados:
// - AdminStatsPlans.tsx, AdminStatsVisits.tsx, AdminStatsAds.tsx, 
// - AdminStatsNews.tsx, AdminStatsBoosted.tsx

export { default } from './admin/AdminStats';