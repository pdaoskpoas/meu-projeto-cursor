import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from './utils';

type PlanId = 'free' | 'basic' | 'pro' | 'ultra' | 'vip';

interface PlanCounts {
  free: number;
  basic: number;
  pro: number;
  ultra: number;
  vip: number;
}

interface VipProfile {
  id: string;
  name: string | null;
  email: string | null;
  plan_purchased_at: string | null;
  plan_expires_at: string | null;
}

interface PlanTransaction {
  id: string;
  amount: number;
  plan_type: string | null;
  status: string | null;
  created_at: string | null;
  is_annual: boolean | null;
  metadata: Record<string, unknown> | null;
  profiles?: { name: string | null; email: string | null } | null;
}

const planLabels: Record<PlanId, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  ultra: 'Ultra',
  vip: 'VIP (Admin)'
};

const AdminStatsPlans: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<PlanCounts>({
    free: 0,
    basic: 0,
    pro: 0,
    ultra: 0,
    vip: 0
  });
  const [vipProfiles, setVipProfiles] = useState<VipProfile[]>([]);
  const [transactions, setTransactions] = useState<PlanTransaction[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const planIds: PlanId[] = ['free', 'basic', 'pro', 'ultra', 'vip'];
        const planCounts = await Promise.all(
          planIds.map(async (plan) => {
            const { count } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .eq('plan', plan);
            return { plan, count: count || 0 };
          })
        );

        const nextCounts = planCounts.reduce((acc, item) => {
          acc[item.plan] = item.count;
          return acc;
        }, { free: 0, basic: 0, pro: 0, ultra: 0, vip: 0 } as PlanCounts);
        setCounts(nextCounts);

        const { data: vipData, error: vipError } = await supabase
          .from('profiles')
          .select('id, name, email, plan_purchased_at, plan_expires_at')
          .eq('plan', 'vip')
          .order('plan_purchased_at', { ascending: false })
          .limit(50);
        if (vipError) throw vipError;
        setVipProfiles((vipData || []) as VipProfile[]);

        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('id, amount, plan_type, status, created_at, is_annual, metadata, profiles(name,email)')
          .eq('type', 'plan_subscription')
          .order('created_at', { ascending: false })
          .limit(50);
        if (txError) throw txError;
        setTransactions((txData || []) as PlanTransaction[]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados de planos.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const paidTotal = useMemo(() => counts.basic + counts.pro + counts.ultra + counts.vip, [counts]);

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar planos</h3>
        <p className="text-red-700">{error}</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Carregando planos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {(['free', 'basic', 'pro', 'ultra', 'vip'] as PlanId[]).map((plan) => (
          <Card key={plan} className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{planLabels[plan]}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{counts[plan]}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border">
        <CardHeader>
          <CardTitle className="text-base">Resumo de assinaturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div>
              Total de assinantes pagos: <span className="font-semibold text-foreground">{paidTotal}</span>
            </div>
            <div>
              VIP concedidos pelo admin: <span className="font-semibold text-foreground">{counts.vip}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">VIP concedidos (início e expiração)</CardTitle>
        </CardHeader>
        <CardContent>
          {vipProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum VIP concedido encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Expiração</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vipProfiles.map((vip) => (
                    <TableRow key={vip.id}>
                      <TableCell>{vip.name || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{vip.email || '-'}</TableCell>
                      <TableCell>{vip.plan_purchased_at ? formatDate(vip.plan_purchased_at) : '-'}</TableCell>
                      <TableCell>{vip.plan_expires_at ? formatDate(vip.plan_expires_at) : 'Vitalício'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">R$ 0,00</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas transações de planos</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem transações de planos registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const isAdminGrant = tx.amount === 0 || tx.metadata?.admin_grant === true || tx.metadata?.granted_by_admin;
                    return (
                      <TableRow key={tx.id}>
                        <TableCell>
                          {tx.profiles?.name || 'Usuário'}{' '}
                          <span className="text-xs text-muted-foreground">{tx.profiles?.email || ''}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{(tx.plan_type || 'Plano').toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>{tx.created_at ? formatDate(tx.created_at) : '-'}</TableCell>
                        <TableCell>
                          <Badge variant={isAdminGrant ? 'outline' : 'default'}>
                            {isAdminGrant ? 'Grátis' : (tx.status || 'N/A')}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(isAdminGrant ? 0 : tx.amount)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStatsPlans;
