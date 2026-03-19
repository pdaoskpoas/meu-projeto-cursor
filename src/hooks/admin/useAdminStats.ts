import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  paidUsers: number;
  freeUsers: number;
  recentSubscriptions: number;
  expiringSoon: number;
  pendingReports: number;
  totalAnimals: number;
  activeAnimals: number;
  totalEvents: number;
  totalViews: number;
  totalClicks: number;
  siteVisitsThisMonth: number;
  homeVisitsThisMonth: number;
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const isMissingPageVisitsTable = (queryError: unknown) => {
          if (!queryError || typeof queryError !== 'object') {
            return false;
          }

          const errorCode = 'code' in queryError ? String(queryError.code) : '';
          const errorMessage = 'message' in queryError ? String(queryError.message).toLowerCase() : '';

          return errorCode === '42P01' || errorMessage.includes('page_visits');
        };

        // Total de usuários
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Usuários ativos
        const { count: activeUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .eq('is_suspended', false);

        // Usuários com planos pagos (inclui VIP sem expiração)
        const nowIso = new Date().toISOString();
        const { count: paidUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .neq('plan', 'free')
          .or(`plan_expires_at.is.null,plan_expires_at.gte.${nowIso}`);

        // Usuários free
        const { count: freeUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('plan', 'free');

        // Assinaturas recentes (últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { count: recentSubscriptions } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('plan_purchased_at', thirtyDaysAgo.toISOString())
          .neq('plan', 'free');

        // Planos expirando em breve (próximos 7 dias)
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const { count: expiringSoon } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .lte('plan_expires_at', sevenDaysFromNow.toISOString())
          .gte('plan_expires_at', new Date().toISOString())
          .neq('plan', 'free');

        // Total de animais
        const { count: totalAnimals } = await supabase
          .from('animals')
          .select('*', { count: 'exact', head: true });

        // Animais ativos
        const { count: activeAnimals } = await supabase
          .from('animals')
          .select('*', { count: 'exact', head: true })
          .eq('ad_status', 'active');

        // Total de eventos
        const { count: totalEvents } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true });

        // Total de visualizações
        const { count: totalViews } = await supabase
          .from('impressions')
          .select('*', { count: 'exact', head: true });

        // Total de cliques
        const { count: totalClicks } = await supabase
          .from('clicks')
          .select('*', { count: 'exact', head: true });

        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const [
          _resSiteVisits,
          _resHomeVisits,
        ] = await Promise.allSettled([
          supabase
            .from('page_visits')
            .select('*', { count: 'exact', head: true })
            .eq('page_key', 'site_access')
            .gte('created_at', firstDayOfMonth.toISOString()),
          supabase
            .from('page_visits')
            .select('*', { count: 'exact', head: true })
            .eq('page_key', 'home')
            .gte('created_at', firstDayOfMonth.toISOString()),
        ]);

        const siteVisitsResult = _resSiteVisits.status === 'fulfilled' ? _resSiteVisits.value : { count: 0, error: null };
        const homeVisitsResult = _resHomeVisits.status === 'fulfilled' ? _resHomeVisits.value : { count: 0, error: null };
        if (_resSiteVisits.status === 'rejected') console.warn('[useAdminStats] site visits query failed:', _resSiteVisits.reason);
        if (_resHomeVisits.status === 'rejected') console.warn('[useAdminStats] home visits query failed:', _resHomeVisits.reason);

        if (siteVisitsResult.error && !isMissingPageVisitsTable(siteVisitsResult.error)) {
          throw siteVisitsResult.error;
        }

        if (homeVisitsResult.error && !isMissingPageVisitsTable(homeVisitsResult.error)) {
          throw homeVisitsResult.error;
        }

        // Reports pendentes
        const { count: pendingReports } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        setStats({
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          paidUsers: paidUsers || 0,
          freeUsers: freeUsers || 0,
          recentSubscriptions: recentSubscriptions || 0,
          expiringSoon: expiringSoon || 0,
          pendingReports: pendingReports || 0,
          totalAnimals: totalAnimals || 0,
          activeAnimals: activeAnimals || 0,
          totalEvents: totalEvents || 0,
          totalViews: totalViews || 0,
          totalClicks: totalClicks || 0,
          siteVisitsThisMonth: siteVisitsResult.count || 0,
          homeVisitsThisMonth: homeVisitsResult.count || 0,
        });
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, isLoading, error, refetch: () => window.location.reload() };
};

