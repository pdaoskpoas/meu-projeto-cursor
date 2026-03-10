import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, RefreshCw, Mail } from 'lucide-react';
import {
  newsletterService,
  type NewsletterSubscription,
} from '@/services/newsletterService';

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const NewsletterSubscriptions: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [subscriptions, setSubscriptions] = useState<NewsletterSubscription[]>([]);

  const loadSubscriptions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await newsletterService.listLatest(500);
      setSubscriptions(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar inscritos.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSubscriptions();
  }, []);

  const filtered = subscriptions.filter((item) =>
    item.email.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Inscritos na Newsletter</h3>
          <p className="text-sm text-gray-600">
            E-mails captados no site com data e horario do cadastro.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadSubscriptions()} className="w-full sm:w-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por e-mail"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-600 py-8">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando inscritos...</span>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          Nenhum e-mail encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">E-mail</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Origem</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Data/Hora</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 text-slate-900">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span>{item.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.source}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(item.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default NewsletterSubscriptions;
