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
const DASHBOARD_STATS_CACHE_TTL_MS = 30 * 1000;

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
          userAnimals,
          { data: userConversations, error: conversationsError },
          { data: profileData, error: profileError }
        ] = await Promise.all([
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

          const [
            { count: impressionsCount, error: impressionsError },
            { count: clicksCount, error: clicksError },
            { count: favoritesCount, error: favoritesError },
            { count: messagesCount, error: messagesError }
          ] = await Promise.all(metricsPromises);

          if (impressionsError) throw impressionsError;
          if (clicksError) throw clicksError;
          if (favoritesError) throw favoritesError;
          if (messagesError) throw messagesError;

          monthlyImpressions = impressionsCount || 0;
          monthlyClicks = clicksCount || 0;
          monthlyFavorites = favoritesCount || 0;
          monthlyMessages = messagesCount || 0;
        }

        const recentActivities = await fetchRecentActivities(user.id, animalIds);

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

  const fetchRecentActivities = async (userId: string, existingAnimalIds: string[]): Promise<RecentActivity[]> => {
    const activities: RecentActivity[] = [];

    try {
      // Últimas atividades (últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // ✅ OTIMIZAÇÃO: Reutilizar IDs já buscados e buscar apenas os nomes
      const { data: userAnimals } = await supabase
        .from('animals')
        .select('id, name')
        .eq('owner_id', userId);

      const animalIds = existingAnimalIds.length > 0 ? existingAnimalIds : (userAnimals?.map(animal => animal.id) || []);
      const animalNamesMap = new Map(userAnimals?.map(animal => [animal.id, animal.name]) || []);

      // ✅ OTIMIZAÇÃO: Executar todas as queries de atividades em paralelo
      const [
        recentImpressionsResult,
        recentFavoritesResult,
        userConversationsResult,
        recentAnimalsResult,
        ticketNotificationsResult
      ] = await Promise.all([
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
        
        // Conversas
        supabase
          .from('conversations')
          .select('id, animal_id')
          .eq('animal_owner_id', userId),
        
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
          .limit(5)
      ]);

      const { data: recentImpressions } = recentImpressionsResult;
      const { data: recentFavorites } = recentFavoritesResult;
      const { data: userConversationsForActivities } = userConversationsResult;
      const { data: recentAnimals } = recentAnimalsResult;
      const { data: ticketNotifications } = ticketNotificationsResult;

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

      // Processar mensagens (se houver conversas, buscar mensagens em paralelo com o resto)
      if (userConversationsForActivities && userConversationsForActivities.length > 0) {
        const conversationIds = userConversationsForActivities.map(conv => conv.id);
        
        const { data: recentMessages } = await supabase
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
          .limit(5);

        recentMessages?.forEach(msg => {
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
