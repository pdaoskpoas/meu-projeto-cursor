import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Transaction {
  id: string;
  userId?: string;
  userName?: string;
  stripePaymentIntentId?: string;
  stripeSubscriptionId?: string;
  asaasPaymentId?: string;
  asaasSubscriptionId?: string;
  asaasCustomerId?: string;
  billingType?: string;
  type: 'plan_subscription' | 'boost_purchase' | 'individual_ad';
  amount: number;
  currency: string;
  planType?: string;
  boostQuantity?: number;
  isAnnual?: boolean;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalTransactions: number;
  completedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  refundedTransactions: number;
  activePlans: number;
  averageTicket: number;
  growthPercentage: number;
}

interface FinancialFilters {
  startDate?: string;
  endDate?: string;
}

export const useAdminFinancial = (filters?: FinancialFilters) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Buscar transações
      let transactionsQuery = supabase
        .from('transactions')
        .select(`
          *,
          user:profiles(name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.startDate) {
        transactionsQuery = transactionsQuery.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        transactionsQuery = transactionsQuery.lt('created_at', filters.endDate);
      }

      const { data: transactionsData, error: transactionsError } = await transactionsQuery;

      if (transactionsError) throw transactionsError;

      const mappedTransactions: Transaction[] = (transactionsData || []).map(t => ({
        id: t.id,
        userId: t.user_id,
        userName: t.user?.name,
        stripePaymentIntentId: t.stripe_payment_intent_id,
        stripeSubscriptionId: t.stripe_subscription_id,
        asaasPaymentId: t.asaas_payment_id,
        asaasSubscriptionId: t.asaas_subscription_id,
        asaasCustomerId: t.asaas_customer_id,
        billingType: t.billing_type,
        type: t.type,
        amount: parseFloat(t.amount),
        currency: t.currency || 'BRL',
        planType: t.plan_type,
        boostQuantity: t.boost_quantity,
        isAnnual: t.is_annual,
        status: t.status,
        metadata: t.metadata,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));

      setTransactions(mappedTransactions);

      // Calcular estatísticas
      const completed = mappedTransactions.filter(t => t.status === 'completed');
      const totalRevenue = completed.reduce((sum, t) => sum + t.amount, 0);

      const now = new Date();
      const rangeStart = filters?.startDate ? new Date(filters.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
      const rangeEnd = filters?.endDate ? new Date(filters.endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const rangeDuration = rangeEnd.getTime() - rangeStart.getTime();

      const periodRevenue = completed
        .filter(t => {
          const date = new Date(t.createdAt);
          return date >= rangeStart && date < rangeEnd;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const previousStart = new Date(rangeStart.getTime() - rangeDuration);
      const previousEnd = rangeStart;
      const previousRevenue = completed
        .filter(t => {
          const date = new Date(t.createdAt);
          return date >= previousStart && date < previousEnd;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const growthPercentage = previousRevenue > 0
        ? ((periodRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

      // Planos ativos
      const { count: activePlans } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .neq('plan', 'free')
        .gte('plan_expires_at', new Date().toISOString());

      setStats({
        totalRevenue,
        monthlyRevenue: periodRevenue,
        totalTransactions: mappedTransactions.length,
        completedTransactions: completed.length,
        pendingTransactions: mappedTransactions.filter(t => t.status === 'pending').length,
        failedTransactions: mappedTransactions.filter(t => t.status === 'failed').length,
        refundedTransactions: mappedTransactions.filter(t => t.status === 'refunded').length,
        activePlans: activePlans || 0,
        averageTicket: completed.length > 0 ? totalRevenue / completed.length : 0,
        growthPercentage,
      });
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [filters?.endDate, filters?.startDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    transactions,
    stats,
    isLoading,
    error,
    refetch: fetchData,
  };
};




