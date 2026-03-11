import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from './utils';

interface BoostHistoryRow {
  id: string;
  content_id: string;
  content_type: string;
  user_id: string | null;
  started_at: string | null;
  expires_at: string | null;
  boost_type: string | null;
  cost: number | null;
  duration_hours: number | null;
}

interface AnimalInfo {
  id: string;
  name: string;
}

interface UserInfo {
  id: string;
  name: string | null;
  email: string | null;
}

const AdminStatsBoosted: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boostHistory, setBoostHistory] = useState<BoostHistoryRow[]>([]);
  const [animalMap, setAnimalMap] = useState<Record<string, AnimalInfo>>({});
  const [userMap, setUserMap] = useState<Record<string, UserInfo>>({});
  const [activeBoostedCount, setActiveBoostedCount] = useState(0);

  useEffect(() => {
    const fetchBoosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const { count: activeCount } = await supabase
          .from('animals')
          .select('*', { count: 'exact', head: true })
          .eq('is_boosted', true)
          .gt('boost_expires_at', new Date().toISOString());
        setActiveBoostedCount(activeCount || 0);

        const { data, error: historyError } = await supabase
          .from('boost_history')
          .select('id, content_id, content_type, user_id, started_at, expires_at, boost_type, cost, duration_hours')
          .eq('content_type', 'animal')
          .order('created_at', { ascending: false })
          .limit(30);
        if (historyError) throw historyError;

        const historyRows = (data || []) as BoostHistoryRow[];
        setBoostHistory(historyRows);

        const animalIds = Array.from(new Set(historyRows.map((row) => row.content_id)));
        const userIds = Array.from(new Set(historyRows.map((row) => row.user_id).filter(Boolean))) as string[];

        if (animalIds.length > 0) {
          const { data: animalsData } = await supabase
            .from('animals')
            .select('id, name')
            .in('id', animalIds);
          const mapping = (animalsData || []).reduce<Record<string, AnimalInfo>>((acc, item) => {
            acc[item.id] = { id: item.id, name: item.name };
            return acc;
          }, {});
          setAnimalMap(mapping);
        }

        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', userIds);
          const mapping = (usersData || []).reduce<Record<string, UserInfo>>((acc, item) => {
            acc[item.id] = { id: item.id, name: item.name, email: item.email };
            return acc;
          }, {});
          setUserMap(mapping);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar turbinados.');
      } finally {
        setLoading(false);
      }
    };

    fetchBoosts();
  }, []);

  const recentBoosts = useMemo(() => boostHistory.slice(0, 20), [boostHistory]);

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar turbinados</h3>
        <p className="text-red-700">{error}</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Carregando turbinados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Anúncios turbinados ativos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{activeBoostedCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Impulsos recentes</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{boostHistory.length}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico recente de turbinados</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBoosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum histórico encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Animal</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Expiração</TableHead>
                    <TableHead>Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBoosts.map((row) => {
                    const animal = animalMap[row.content_id];
                    const user = row.user_id ? userMap[row.user_id] : null;
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{animal?.name || 'Animal'}</TableCell>
                        <TableCell>
                          {user?.name || 'Usuário'}{' '}
                          <span className="text-xs text-muted-foreground">{user?.email || ''}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.boost_type || 'Boost'}</Badge>
                        </TableCell>
                        <TableCell>{row.started_at ? formatDateTime(row.started_at) : '-'}</TableCell>
                        <TableCell>{row.expires_at ? formatDateTime(row.expires_at) : '-'}</TableCell>
                        <TableCell>
                          {row.cost !== null ? `R$ ${row.cost.toFixed(2)}` : 'R$ 0,00'}
                        </TableCell>
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

export default AdminStatsBoosted;
