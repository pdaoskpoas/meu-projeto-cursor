import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { partnershipService } from '@/services/partnershipService';
import { isStaleRequestError, runResilientRequest } from '@/services/resilientRequestService';

export interface DashboardStats {
  // Estatísticas do mês atual
  monthlyImpressions: number;
  monthlyClicks: number;
  monthlyFavorites: number;
  monthlyMessages: number;
  
  // Contadores gerais
  totalAnimals: number;
  featuredAnimals: number;
  availableBoosts: number;
  
  // Atividades recentes
  recentActivities: RecentActivity[];
  
  // Estado de carregamento
  loading: boolean;
  coreLoaded: boolean;
  error: string | null;
}

export interface RecentActivity {
  id: string;
  type: 'impression' | 'click' | 'favorite' | 'message' | 'boost' | 'animal_created' | 'ticket_response';
  title: string;
  description: string;
  timestamp: string;
  animalName?: string;
  animalId?: string;
  ticketId?: string;
}

interface DashboardStatsCacheEntry {
  data: DashboardStats;
  timestamp: number;
}

const dashboardStatsCache = new Map<string, DashboardStatsCacheEntry>();
const DASHBOARD_STATS_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutos - dados do dashboard mudam pouco

/** Limpa o cache do dashboard para forçar refetch na próxima visita */
export const clearDashboardCache = () => {
  dashboardStatsCache.clear();
};

export const useDashboardStats = () => {
  const { user } = useAuth();
  const requestIdRef = useRef(0);
  const [stats, setStats] = useState<DashboardStats>({
    monthlyImpressions: 0,
    monthlyClicks: 0,
    monthlyFavorites: 0,
    monthlyMessages: 0,
    totalAnimals: 0,
    featuredAnimals: 0,
    availableBoosts: 0,
    recentActivities: [],
    loading: true,
    coreLoaded: false,
    error: null,
  });

  const fetchDashboardStats = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!user?.id) {
      if (requestId === requestIdRef.current) {
        setStats(prev => ({ ...prev, loading: false }));
      }
      return;
    }

    try {
      const cached = dashboardStatsCache.get(user.id);
      if (cached && Date.now() - cached.timestamp < DASHBOARD_STATS_CACHE_TTL_MS) {
        if (requestId === requestIdRef.current) {
          setStats({ ...cached.data, loading: false });
        }
        return;
      }

      if (requestId === requestIdRef.current) {
        setStats(prev => ({ ...prev, loading: true, error: null }));
      }

      const nextStats = await runResilientRequest(async () => {
        // Data do início do mês atual
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const startOfMonthISO = startOfMonth.toISOString();

        // ✅ OTIMIZAÇÃO 1: Executar queries de animais e conversas em paralelo
        const [
          _resUserAnimals,
          _resConversations,
          _resProfile
        ] = await Promise.allSettled([
          partnershipService.getUserAnimalsWithPartnerships(user.id),
          supabase
            .from('conversations')
            .select('id')
            .eq('animal_owner_id', user.id),
          supabase
            .from('profiles')
            .select('available_boosts, plan_boost_credits, purchased_boost_credits')
            .eq('id', user.id)
            .single()
        ]);

        const userAnimals = _resUserAnimals.status === 'fulfilled' ? _resUserAnimals.value : [];
        const { data: userConversations, error: conversationsError } = _resConversations.status === 'fulfilled' ? _resConversations.value : { data: null, error: null };
        const { data: profileData, error: profileError } = _resProfile.status === 'fulfilled' ? _resProfile.value : { data: null, error: null };
        if (_resUserAnimals.status === 'rejected') console.warn('[useDashboardStats] getUserAnimalsWithPartnerships failed:', _resUserAnimals.reason);
        if (_resConversations.status === 'rejected') console.warn('[useDashboardStats] conversations query failed:', _resConversations.reason);
        if (_resProfile.status === 'rejected') console.warn('[useDashboardStats] profile query failed:', _resProfile.reason);

        if (conversationsError) throw conversationsError;
        if (profileError) throw profileError;

        const animalIds = userAnimals?.map(animal => animal.id) || [];
        const conversationIds = userConversations?.map(conv => conv.id) || [];
        const availableBoosts = (profileData?.available_boosts || 0) +
          (profileData?.plan_boost_credits || 0) +
          (profileData?.purchased_boost_credits || 0);
        const totalAnimals = userAnimals?.length || 0;
        const featuredAnimals = userAnimals?.filter(a =>
          a.is_boosted &&
          a.ad_status === 'active' &&
          a.boost_expires_at &&
          new Date(a.boost_expires_at) > new Date()
        ).length || 0;

        // ✅ RENDERIZAÇÃO PROGRESSIVA: exibir dados core enquanto métricas carregam
        if (requestId === requestIdRef.current) {
          setStats(prev => ({
            ...prev,
            totalAnimals: totalAnimals || 0,
            featuredAnimals: featuredAnimals || 0,
            availableBoosts,
            coreLoaded: true,
          }));
        }

        const animalNamesMap = new Map(userAnimals?.map(a => [a.id, a.name]) || []);

        // ✅ OTIMIZAÇÃO: Executar métricas E atividades recentes EM PARALELO
        // Ambas dependem apenas do Stage 1 (animais/conversas) — são independentes entre si
        const [metrics, recentActivities] = await Promise.all([
          // Stage 2: Métricas do mês
          (async () => {
            let monthlyImpressions = 0;
            let monthlyClicks = 0;
            let monthlyFavorites = 0;
            let monthlyMessages = 0;

            if (animalIds.length > 0 || conversationIds.length > 0) {
              const metricsPromises = [];

              if (animalIds.length > 0) {
                metricsPromises.push(
                  supabase
                    .from('impressions')
                    .select('*', { count: 'exact', head: true })
                    .in('content_id', animalIds)
                    .eq('content_type', 'animal')
                    .gte('created_at', startOfMonthISO),
                  supabase
                    .from('clicks')
                    .select('*', { count: 'exact', head: true })
                    .in('content_id', animalIds)
                    .eq('content_type', 'animal')
                    .gte('created_at', startOfMonthISO),
                  supabase
                    .from('favorites')
                    .select('*', { count: 'exact', head: true })
                    .in('animal_id', animalIds)
                    .gte('created_at', startOfMonthISO)
                );
              } else {
                metricsPromises.push(
                  Promise.resolve({ count: 0, error: null }),
                  Promise.resolve({ count: 0, error: null }),
                  Promise.resolve({ count: 0, error: null })
                );
              }

              if (conversationIds.length > 0) {
                metricsPromises.push(
                  supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .in('conversation_id', conversationIds)
                    .neq('sender_id', user.id)
                    .gte('created_at', startOfMonthISO)
                );
              } else {
                metricsPromises.push(Promise.resolve({ count: 0, error: null }));
              }

              const _metricsResults = await Promise.allSettled(metricsPromises);

              const _resImpressions = _metricsResults[0];
              const _resClicks = _metricsResults[1];
              const _resFavorites = _metricsResults[2];
              const _resMessages = _metricsResults[3];

              const { count: impressionsCount, error: impressionsError } = _resImpressions?.status === 'fulfilled' ? _resImpressions.value : { count: 0, error: null };
              const { count: clicksCount, error: clicksError } = _resClicks?.status === 'fulfilled' ? _resClicks.value : { count: 0, error: null };
              const { count: favoritesCount, error: favoritesError } = _resFavorites?.status === 'fulfilled' ? _resFavorites.value : { count: 0, error: null };
              const { count: messagesCount, error: messagesError } = _resMessages?.status === 'fulfilled' ? _resMessages.value : { count: 0, error: null };
              if (_resImpressions?.status === 'rejected') console.warn('[useDashboardStats] impressions query failed:', _resImpressions.reason);
              if (_resClicks?.status === 'rejected') console.warn('[useDashboardStats] clicks query failed:', _resClicks.reason);
              if (_resFavorites?.status === 'rejected') console.warn('[useDashboardStats] favorites query failed:', _resFavorites.reason);
              if (_resMessages?.status === 'rejected') console.warn('[useDashboardStats] messages query failed:', _resMessages.reason);

              if (impressionsError) throw impressionsError;
              if (clicksError) throw clicksError;
              if (favoritesError) throw favoritesError;
              if (messagesError) throw messagesError;

              monthlyImpressions = impressionsCount || 0;
              monthlyClicks = clicksCount || 0;
              monthlyFavorites = favoritesCount || 0;
              monthlyMessages = messagesCount || 0;
            }

            return { monthlyImpressions, monthlyClicks, monthlyFavorites, monthlyMessages };
          })(),
          // Stage 3: Atividades recentes (passa conversationIds para evitar query duplicada)
          fetchRecentActivities(user.id, animalIds, animalNamesMap, conversationIds)
        ]);

        const { monthlyImpressions, monthlyClicks, monthlyFavorites, monthlyMessages } = metrics;

        const nextStats: DashboardStats = {
          monthlyImpressions: monthlyImpressions || 0,
          monthlyClicks: monthlyClicks || 0,
          monthlyFavorites: monthlyFavorites || 0,
          monthlyMessages: monthlyMessages || 0,
          totalAnimals: totalAnimals || 0,
          featuredAnimals: featuredAnimals || 0,
          availableBoosts,
          recentActivities,
          loading: false,
          coreLoaded: true,
          error: null,
        };

        return nextStats;
      }, {
        timeoutMs: 45000,
        errorMessage: 'O carregamento do dashboard demorou demais.',
        requestKey: `dashboard-stats:${user.id}`
      });

      if (requestId !== requestIdRef.current) return;

      dashboardStatsCache.set(user.id, {
        data: nextStats,
        timestamp: Date.now()
      });

      setStats(nextStats);

    } catch (error: unknown) {
      if (isStaleRequestError(error) || requestId !== requestIdRef.current) return;
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      const message = error instanceof Error ? error.message : 'Erro ao carregar estatísticas';
      setStats(prev => ({
        ...prev,
        loading: false,
        error: message,
      }));
    } finally {
      if (requestId === requestIdRef.current) {
        setStats(prev => ({ ...prev, loading: false }));
      }
    }
  }, [user?.id]);

  const fetchRecentActivities = async (userId: string, existingAnimalIds: string[], existingNamesMap?: Map<string, string>, existingConversationIds?: string[]): Promise<RecentActivity[]> => {
    const activities: RecentActivity[] = [];

    try {
      // Últimas atividades (últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Reutilizar dados já carregados (evita query extra)
      const animalIds = existingAnimalIds;
      const animalNamesMap = existingNamesMap || new Map<string, string>();
      const conversationIds = existingConversationIds || [];

      // ✅ OTIMIZAÇÃO: Executar todas as queries de atividades em paralelo (incluindo mensagens)
      const [
        _resRecentImpressions,
        _resRecentFavorites,
        _resRecentAnimals,
        _resTicketNotifications,
        _resRecentMessages
      ] = await Promise.allSettled([
        // Impressões (apenas se houver animais)
        animalIds.length > 0
          ? supabase
              .from('impressions')
              .select('created_at, content_id')
              .in('content_id', animalIds)
              .eq('content_type', 'animal')
              .gte('created_at', sevenDaysAgo.toISOString())
              .order('created_at', { ascending: false })
              .limit(10)
          : Promise.resolve({ data: null }),

        // Favoritos (apenas se houver animais)
        animalIds.length > 0
          ? supabase
              .from('favorites')
              .select('created_at, animal_id')
              .in('animal_id', animalIds)
              .gte('created_at', sevenDaysAgo.toISOString())
              .order('created_at', { ascending: false })
              .limit(5)
          : Promise.resolve({ data: null }),

        // Animais recém-criados
        supabase
          .from('animals')
          .select('created_at, name, id')
          .eq('owner_id', userId)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(3),

        // Notificações de tickets
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'ticket_response')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5),

        // ✅ Mensagens recentes (agora em paralelo — usa conversationIds já carregados do Stage 1)
        conversationIds.length > 0
          ? supabase
              .from('messages')
              .select(`
                created_at,
                content,
                conversation_id,
                conversations!inner(animal_id)
              `)
              .in('conversation_id', conversationIds)
              .neq('sender_id', userId)
              .gte('created_at', sevenDaysAgo.toISOString())
              .order('created_at', { ascending: false })
              .limit(5)
          : Promise.resolve({ data: null })
      ]);

      const recentImpressionsResult = _resRecentImpressions.status === 'fulfilled' ? _resRecentImpressions.value : { data: null };
      const recentFavoritesResult = _resRecentFavorites.status === 'fulfilled' ? _resRecentFavorites.value : { data: null };
      const recentAnimalsResult = _resRecentAnimals.status === 'fulfilled' ? _resRecentAnimals.value : { data: null };
      const ticketNotificationsResult = _resTicketNotifications.status === 'fulfilled' ? _resTicketNotifications.value : { data: null };
      const recentMessagesResult = _resRecentMessages.status === 'fulfilled' ? _resRecentMessages.value : { data: null };
      if (_resRecentImpressions.status === 'rejected') console.warn('[useDashboardStats] recent impressions query failed:', _resRecentImpressions.reason);
      if (_resRecentFavorites.status === 'rejected') console.warn('[useDashboardStats] recent favorites query failed:', _resRecentFavorites.reason);
      if (_resRecentAnimals.status === 'rejected') console.warn('[useDashboardStats] recent animals query failed:', _resRecentAnimals.reason);
      if (_resTicketNotifications.status === 'rejected') console.warn('[useDashboardStats] ticket notifications query failed:', _resTicketNotifications.reason);
      if (_resRecentMessages.status === 'rejected') console.warn('[useDashboardStats] recent messages query failed:', _resRecentMessages.reason);

      const { data: recentImpressions } = recentImpressionsResult;
      const { data: recentFavorites } = recentFavoritesResult;
      const { data: recentAnimals } = recentAnimalsResult;
      const { data: ticketNotifications } = ticketNotificationsResult;
      const { data: recentMessages } = recentMessagesResult;

      // Processar impressões
      if (recentImpressions && animalIds.length > 0) {
        const impressionGroups: { [key: string]: { count: number; name: string; lastSeen: string; animalId: string } } = {};
        
        recentImpressions.forEach(imp => {
          const key = imp.content_id;
          if (!impressionGroups[key]) {
            impressionGroups[key] = {
              count: 0,
              name: animalNamesMap.get(imp.content_id) || 'Animal',
              lastSeen: imp.created_at || '',
              animalId: imp.content_id
            };
          }
          impressionGroups[key].count++;
          if (imp.created_at && imp.created_at > impressionGroups[key].lastSeen) {
            impressionGroups[key].lastSeen = imp.created_at;
          }
        });

        Object.entries(impressionGroups).forEach(([animalId, data]) => {
          activities.push({
            id: `impression-${animalId}`,
            type: 'impression',
            title: `${data.name} teve ${data.count} nova${data.count > 1 ? 's' : ''} visualização${data.count > 1 ? 'ões' : ''}`,
            description: `Seu animal está chamando atenção!`,
            timestamp: data.lastSeen,
            animalName: data.name,
            animalId: animalId,
          });
        });
      }

      // Processar favoritos
      if (recentFavorites) {
        recentFavorites.forEach(fav => {
          activities.push({
            id: `favorite-${fav.animal_id}-${fav.created_at}`,
            type: 'favorite',
            title: `${animalNamesMap.get(fav.animal_id) || 'Animal'} foi favoritado`,
            description: 'Alguém adicionou seu animal aos favoritos',
            timestamp: fav.created_at || '',
            animalName: animalNamesMap.get(fav.animal_id),
            animalId: fav.animal_id,
          });
        });
      }

      // Processar mensagens (resultado já disponível do batch paralelo)
      if (recentMessages) {
        recentMessages.forEach(msg => {
          const conversation = msg.conversations as Record<string, unknown> | null;
          const animalId = conversation?.animal_id;
          const animalName = animalId ? animalNamesMap.get(animalId) : undefined;

          activities.push({
            id: `message-${msg.created_at}`,
            type: 'message',
            title: `Nova mensagem${animalName ? ` sobre ${animalName}` : ''}`,
            description: msg.content ? msg.content.substring(0, 50) + '...' : 'Mensagem recebida',
            timestamp: msg.created_at || '',
            animalName: animalName,
            animalId: animalId,
          });
        });
      }

      // Processar animais criados
      if (recentAnimals) {
        recentAnimals.forEach(animal => {
          activities.push({
            id: `animal-created-${animal.id}`,
            type: 'animal_created',
            title: `${animal.name} foi cadastrado`,
            description: 'Animal adicionado ao seu plantel',
            timestamp: animal.created_at || '',
            animalName: animal.name,
            animalId: animal.id,
          });
        });
      }

      // Processar notificações de tickets
      if (ticketNotifications) {
        ticketNotifications.forEach(notification => {
          activities.push({
            id: `ticket-response-${notification.id}`,
            type: 'ticket_response',
            title: notification.title,
            description: notification.message,
            timestamp: notification.created_at,
            ticketId: notification.related_content_id || undefined,
          });
        });
      }

      // Ordenar por timestamp (mais recente primeiro) e limitar a 6
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 6);

    } catch (error) {
      console.error('Erro ao buscar atividades recentes:', error);
      return [];
    }
  };

  // Carregar dados quando o usuário mudar
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Função para recarregar dados
  const refreshStats = useCallback(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  return {
    ...stats,
    refreshStats,
  };
};
