import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface HarasEvent {
  id: string;
  title: string;
  event_type: string | null;
  start_date: string;
  end_date: string | null;
  city: string | null;
  state: string | null;
  cover_image_url: string | null;
  is_boosted?: boolean;
  published_at?: string | null;
}

interface HarasEventsSectionProps {
  organizerId?: string;
}

const HarasEventsSection: React.FC<HarasEventsSectionProps> = ({ organizerId }) => {
  const [events, setEvents] = useState<HarasEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatShortDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return 'Data a confirmar';
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
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

  useEffect(() => {
    let mounted = true;

    const fetchEvents = async () => {
      if (!organizerId) {
        setEvents([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('events_with_stats')
          .select('id, title, event_type, start_date, end_date, city, state, cover_image_url, is_boosted, published_at')
          .eq('organizer_id', organizerId)
          .eq('ad_status', 'active')
          .order('published_at', { ascending: false });

        if (error) throw error;
        if (mounted) {
          setEvents(data || []);
        }
      } catch (error) {
        console.error('Erro ao buscar eventos do perfil:', error);
        if (mounted) {
          setEvents([]);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchEvents();
    return () => {
      mounted = false;
    };
  }, [organizerId]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aExpired = isEventExpired(a);
      const bExpired = isEventExpired(b);
      if (aExpired !== bExpired) {
        return aExpired ? 1 : -1;
      }
      const aDate = new Date(a.published_at || a.start_date).getTime();
      const bDate = new Date(b.published_at || b.start_date).getTime();
      return bDate - aDate;
    });
  }, [events]);

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Eventos publicados</h2>
          <p className="text-sm text-slate-600">
            Eventos ativos e expirados deste perfil
          </p>
        </div>
        <span className="text-sm text-slate-500">
          {events.length} no total
        </span>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center text-slate-500">
          Carregando eventos...
        </Card>
      ) : events.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          Nenhum evento publicado ainda.
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedEvents.map((event) => {
            const isExpired = isEventExpired(event);
            return (
              <Link
                key={event.id}
                to={`/eventos/${event.id}`}
                className="group block rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="relative h-40 bg-slate-100">
                  {event.cover_image_url ? (
                    <img
                      src={event.cover_image_url}
                      alt={event.title}
                      className={`w-full h-full object-cover ${isExpired ? 'grayscale opacity-80' : ''}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      📅
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge className={isExpired ? 'bg-slate-600 text-white' : 'bg-emerald-600 text-white'}>
                      {isExpired ? 'Encerrado' : 'Ativo'}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatShortDate(event.start_date)}
                      {event.end_date && ` - ${formatShortDate(event.end_date)}`}
                    </span>
                  </div>
                  {(event.city || event.state) && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {event.city}
                        {event.city && event.state && ', '}
                        {event.state}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default HarasEventsSection;
