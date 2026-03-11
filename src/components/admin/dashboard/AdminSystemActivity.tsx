import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AdminActivityRow {
  id: string | null;
  action: string | null;
  admin_id: string | null;
  admin_name: string | null;
  admin_email: string | null;
  resource_type: string | null;
  resource_id: string | null;
  created_at: string | null;
  details: Record<string, unknown> | null;
}

const AdminSystemActivity: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AdminActivityRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        const [logsResult, countResult] = await Promise.all([
          supabase
            .from('admin_audit_logs_with_admin')
            .select('id, action, admin_id, admin_name, admin_email, resource_type, resource_id, created_at, details')
            .order('created_at', { ascending: false })
            .limit(50),
          supabase
            .from('admin_audit_log')
            .select('*', { count: 'exact', head: true })
        ]);

        if (logsResult.error) throw logsResult.error;
        if (countResult.error) throw countResult.error;

        setLogs((logsResult.data || []) as AdminActivityRow[]);
        setTotalCount(countResult.count || 0);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar logs.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const last24hCount = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return logs.filter((log) => log.created_at && new Date(log.created_at).getTime() >= cutoff).length;
  }, [logs]);

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar atividade</h3>
        <p className="text-red-700">{error}</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Carregando atividade...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total de ações registradas</p>
          <p className="text-2xl font-semibold">{totalCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Últimas 24 horas</p>
          <p className="text-2xl font-semibold">{last24hCount}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Atividade do Sistema</h3>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum log de auditoria encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id || Math.random().toString(36)}>
                    <TableCell className="text-muted-foreground">
                      {log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action || 'ação'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{log.admin_name || 'Admin'}</div>
                        <div className="text-muted-foreground text-xs">{log.admin_email || ''}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{log.resource_type || '-'}</div>
                        <div className="text-muted-foreground text-xs">{log.resource_id || ''}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminSystemActivity;
