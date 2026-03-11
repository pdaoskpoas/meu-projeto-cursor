import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AdminMessageStats {
  totalMessages: number;
  totalConversations: number;
  activeConversations: number;
  messagesThisMonth: number;
}

export const useAdminMessages = () => {
  const [stats, setStats] = useState<AdminMessageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Total de mensagens
      const { count: totalMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      // Total de conversas
      const { count: totalConversations } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true });

      // Conversas ativas
      const { count: activeConversations } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Mensagens deste mês
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { count: messagesThisMonth } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth.toISOString());

      setStats({
        totalMessages: totalMessages || 0,
        totalConversations: totalConversations || 0,
        activeConversations: activeConversations || 0,
        messagesThisMonth: messagesThisMonth || 0,
      });
    } catch (err) {
      console.error('Error fetching message stats:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
};




