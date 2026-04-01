import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService } from '@/services/analyticsService';
import EventDetailsHero from './components/EventDetailsHero';
import EventDetailsContent from './components/EventDetailsContent';
import { EventDetailsEvent, EventListItem } from './types';

const EventDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<EventDetailsEvent | null>(null);
  const [otherEvents, setOtherEvents] = useState<EventListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Formatar data
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data a confirmar';
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data a confirmar';
    }
  };

  const formatShortDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
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

  // Carregar evento
  useEffect(() => {
    if (!id) return;

    const loadEvent = async () => {
      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from('events_with_stats')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        setEvent(data);

        // Registrar impressão da página de detalhes
        analyticsService.recordImpression('event', id, user?.id, {
          pageUrl: window.location.href
        });

        const { data: otherEventsData } = await supabase
          .from('events_with_stats')
          .select('id, title, event_type, start_date, end_date, city, state, cover_image_url')
          .eq('ad_status', 'active')
          .neq('id', id)
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
  }, [id, user?.id, toast]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <EventDetailsHero
        event={event}
        onShare={handleShare}
        getEventIcon={getEventIcon}
      />

      <div className="container mx-auto px-4 -mt-8 relative z-10 pb-12">
        <div className="max-w-5xl mx-auto">
          <EventDetailsContent
            event={event}
            formatDate={formatDate}
            getEventIcon={getEventIcon}
            onShare={handleShare}
          />
        </div>

        <div className="max-w-5xl mx-auto mt-10">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Outros eventos ativos
              </h3>
              <span className="text-sm text-gray-500">
                {otherEvents.length} disponíveis
              </span>
            </div>
            {otherEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherEvents.map((otherEvent) => (
                  <Link
                    key={otherEvent.id}
                    to={`/eventos/${otherEvent.id}`}
                    className="block rounded-lg border border-slate-200 overflow-hidden hover:border-blue-200 hover:shadow-md transition-all bg-white"
                  >
                    <div className="h-36 bg-slate-100 flex items-center justify-center">
                      {otherEvent.cover_image_url ? (
                        <img
                          src={otherEvent.cover_image_url}
                          alt={otherEvent.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">
                          {getEventIcon(otherEvent.event_type)}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-slate-900 line-clamp-2">
                        {otherEvent.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        {formatShortDate(otherEvent.start_date)}
                        {otherEvent.end_date && ` - ${formatShortDate(otherEvent.end_date)}`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Nenhum outro evento ativo no momento.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;


