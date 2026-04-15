import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService } from '@/services/analyticsService';
import EventDetailsHero from './components/EventDetailsHero';
import EventDetailsContent from './components/EventDetailsContent';
import { EventDetailsEvent, EventListItem } from './types';
import { buildEventUrl, parseEventParam } from '@/utils/urls';

const EventDetailsPage: React.FC = () => {
  const { slug: routeParam } = useParams<{ slug: string }>();
  const parsedParam = parseEventParam(routeParam);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<EventDetailsEvent | null>(null);
  const [otherEvents, setOtherEvents] = useState<EventListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canonicalRedirect, setCanonicalRedirect] = useState<string | null>(null);

  // Formatar data
  const formatDate = (dateString: string): string => {
    try {
      const parts = dateString.split('T')[0].split('-').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) return 'Data a confirmar';
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      if (isNaN(date.getTime())) return 'Data a confirmar';
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'Data a confirmar';
    }
  };

  const formatShortDate = (dateString: string): string => {
    try {
      const parts = dateString.split('T')[0].split('-').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) return 'Data a confirmar';
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      if (isNaN(date.getTime())) return 'Data a confirmar';
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short'
      });
    } catch {
      return 'Data a confirmar';
    }
  };

  const isEventExpired = (candidate: { end_date: string | null; start_date: string }) => {
    const referenceDate = candidate.end_date || candidate.start_date;
    if (!referenceDate) return false;
    const date = new Date(referenceDate);
    if (Number.isNaN(date.getTime())) return false;
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay.getTime() < Date.now();
  };

  // Carregar evento (aceita slug ou UUID legado)
  useEffect(() => {
    if (parsedParam.kind === 'invalid') {
      setIsLoading(false);
      return;
    }

    const loadEvent = async () => {
      try {
        setIsLoading(true);

        const query = supabase.from('events_with_stats').select('*');
        const { data, error } =
          parsedParam.kind === 'uuid'
            ? await query.eq('id', parsedParam.uuid).maybeSingle()
            : await query.eq('slug', parsedParam.slug).maybeSingle();

        if (error) throw error;

        if (!data) {
          setEvent(null);
          setIsLoading(false);
          return;
        }

        // SEO: se chegou via UUID (link antigo) e o evento tem slug,
        // redireciona para URL canônica.
        if (parsedParam.kind === 'uuid' && data.slug) {
          setCanonicalRedirect(buildEventUrl(data));
          return;
        }

        setEvent(data);

        // Registrar impressão da página de detalhes
        analyticsService.recordImpression('event', data.id, user?.id, {
          pageUrl: window.location.href
        });

        const { data: otherEventsData } = await supabase
          .from('events_with_stats')
          .select('id, slug, title, event_type, start_date, end_date, city, state, cover_image_url')
          .eq('ad_status', 'active')
          .neq('id', data.id)
          .order('published_at', { ascending: false })
          .limit(6);

        const activeOthers = (otherEventsData || []).filter(
          (item) => !isEventExpired(item)
        );
        setOtherEvents(activeOthers);
      } catch {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o evento.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [routeParam, parsedParam.kind, user?.id, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handler de compartilhamento
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: event?.description || '',
        url: window.location.href
      }).catch(() => {
        // Fallback: copiar URL
        copyToClipboard();
      });
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Link copiado!',
      description: 'O link do evento foi copiado para a área de transferência.'
    });
  };

  // Ícone do tipo de evento
  const getEventIcon = (type: string | null) => {
    switch (type) {
      case 'Competição': return '';
      case 'Leilão': return '';
      case 'Exposição': return '';
      case 'Copa': return '';
      case 'Curso': return '';
      case 'Encontro': return '';
      default: return '';
    }
  };

  // Redirect de URL antiga (UUID) para URL canônica com slug — SEO
  if (canonicalRedirect) {
    return <Navigate to={canonicalRedirect} replace />;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-96 bg-gray-200 rounded-xl"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto p-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Evento não encontrado</h1>
          <p className="text-gray-600 mb-6">
            O evento que você está procurando não existe ou foi removido.
          </p>
          <Button onClick={() => navigate('/eventos')}>
            Voltar para Eventos
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <EventDetailsHero
        event={event}
        onShare={handleShare}
        getEventIcon={getEventIcon}
      />

      <div className="container mx-auto px-4 py-8 sm:py-10 pb-16">
        <div className="max-w-6xl mx-auto">
          <EventDetailsContent
            event={event}
            formatDate={formatDate}
            getEventIcon={getEventIcon}
            onShare={handleShare}
          />
        </div>

        <div className="max-w-6xl mx-auto mt-12">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
                Continue explorando
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Outros eventos ativos
              </h3>
            </div>
            <span className="text-sm text-slate-500 shrink-0">
              {otherEvents.length} {otherEvents.length === 1 ? 'disponível' : 'disponíveis'}
            </span>
          </div>

          {otherEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {otherEvents.map((otherEvent) => (
                <Link
                  key={otherEvent.id}
                  to={buildEventUrl(otherEvent)}
                  className="group block rounded-xl border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all bg-white"
                >
                  <div className="aspect-[16/10] bg-slate-100 flex items-center justify-center overflow-hidden">
                    {otherEvent.cover_image_url ? (
                      <img
                        src={otherEvent.cover_image_url}
                        alt={otherEvent.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-4xl opacity-60">
                        {getEventIcon(otherEvent.event_type)}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {otherEvent.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {formatShortDate(otherEvent.start_date)}
                      {otherEvent.end_date && ` – ${formatShortDate(otherEvent.end_date)}`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center border-dashed">
              <p className="text-sm text-slate-500">
                Nenhum outro evento ativo no momento.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;


