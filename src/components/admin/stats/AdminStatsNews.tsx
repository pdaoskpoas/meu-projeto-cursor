import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ArticleRow {
  id: string;
  title: string;
  category: string | null;
  is_published: boolean | null;
  published_at: string | null;
  created_at: string | null;
  views?: number | null;
}

const AdminStatsNews: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ total: 0, published: 0, drafts: 0, scheduled: 0 });
  const [topArticles, setTopArticles] = useState<ArticleRow[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);

        const { count: total } = await supabase
          .from('articles')
          .select('*', { count: 'exact', head: true });

        const { count: published } = await supabase
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .eq('is_published', true);

        const { count: drafts } = await supabase
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .eq('is_published', false);

        const nowIso = new Date().toISOString();
        const { count: scheduled } = await supabase
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .eq('is_published', true)
          .gt('published_at', nowIso);

        const { data, error: articlesError } = await supabase
          .from('articles')
          .select('id, title, category, is_published, published_at, created_at, views')
          .order('views', { ascending: false })
          .limit(10);
        if (articlesError) throw articlesError;

        setCounts({
          total: total || 0,
          published: published || 0,
          drafts: drafts || 0,
          scheduled: scheduled || 0
        });
        setTopArticles((data || []) as ArticleRow[]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar notícias.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar notícias</h3>
        <p className="text-red-700">{error}</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Carregando notícias...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{counts.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Publicados</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{counts.published}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Rascunhos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{counts.drafts}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Agendados</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{counts.scheduled}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Artigos mais vistos</CardTitle>
        </CardHeader>
        <CardContent>
          {topArticles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum artigo encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Publicado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topArticles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell className="font-medium">{article.title}</TableCell>
                      <TableCell>{article.category || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={article.is_published ? 'default' : 'secondary'}>
                          {article.is_published ? 'Publicado' : 'Rascunho'}
                        </Badge>
                      </TableCell>
                      <TableCell>{(article.views || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {article.published_at ? new Date(article.published_at).toLocaleDateString('pt-BR') : '-'}
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

export default AdminStatsNews;
