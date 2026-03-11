import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AnimalRow {
  id: string;
  name: string;
  ad_status: 'active' | 'paused' | 'expired' | 'draft';
  created_at: string | null;
  haras_name: string | null;
}

const AdminStatsAds: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ active: 0, paused: 0, expired: 0, draft: 0 });
  const [recentAds, setRecentAds] = useState<AnimalRow[]>([]);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        setError(null);

        const statuses: Array<keyof typeof counts> = ['active', 'paused', 'expired', 'draft'];
        const statusCounts = await Promise.all(
          statuses.map(async (status) => {
            const { count } = await supabase
              .from('animals')
              .select('*', { count: 'exact', head: true })
              .eq('ad_status', status);
            return { status, count: count || 0 };
          })
        );

        const nextCounts = statusCounts.reduce((acc, item) => {
          acc[item.status] = item.count;
          return acc;
        }, { active: 0, paused: 0, expired: 0, draft: 0 } as typeof counts);
        setCounts(nextCounts);

        const { data, error: adsError } = await supabase
          .from('animals')
          .select('id, name, ad_status, created_at, haras_name')
          .order('created_at', { ascending: false })
          .limit(15);
        if (adsError) throw adsError;

        setRecentAds((data || []) as AnimalRow[]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar anúncios.');
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar anúncios</h3>
        <p className="text-red-700">{error}</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Carregando anúncios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Ativos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{counts.active}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pausados</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{counts.paused}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Expirados</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{counts.expired}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Rascunhos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{counts.draft}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anúncios recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAds.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum anúncio encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Animal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Haras</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAds.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell className="font-medium">{ad.name}</TableCell>
                      <TableCell>
                        <Badge variant={ad.ad_status === 'active' ? 'default' : 'secondary'}>
                          {ad.ad_status === 'active'
                            ? 'Ativo'
                            : ad.ad_status === 'paused'
                              ? 'Pausado'
                              : ad.ad_status === 'expired'
                                ? 'Expirado'
                                : 'Rascunho'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{ad.haras_name || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {ad.created_at ? new Date(ad.created_at).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStatsAds;
