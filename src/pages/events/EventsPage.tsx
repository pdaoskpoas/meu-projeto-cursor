import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Filter, Search, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import EventCard from '@/components/events/EventCard';

interface Event {
  id: string;
  title: string;
  event_type: string | null;
  description: string | null;
  start_date: string;
  end_date: string | null;
  city: string | null;
  state: string | null;
  location: string | null;
  cover_image_url: string | null;
  max_participants: number | null;
  organizer_property: string;
  organizer_id?: string | null;
  organizer_name?: string | null;
  organizer_public_code?: string | null;
  is_boosted: boolean;
  impressions: number;
  clicks: number;
}

const EventsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar eventos do Supabase
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('events_with_stats')
        .select('*')
        .eq('ad_status', 'active')
        .order('is_boosted', { ascending: false })
        .order('published_at', { ascending: false });

      if (error) throw error;
      
      // Filtrar eventos com boost expirado e reordenar
      const now = new Date();
      const processedEvents = (data || []).map(event => ({
        ...event,
        // Marcar boost como inativo se expirou
        is_boosted: event.is_boosted && event.boost_expires_at && new Date(event.boost_expires_at) > now
      })).sort((a, b) => {
        // Ordenar: boosted ativos primeiro, depois por data de publicação
        if (a.is_boosted !== b.is_boosted) {
          return a.is_boosted ? -1 : 1;
        }
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      });
      
      setEvents(processedEvents);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = () => {
    if (user) {
      navigate('/dashboard/events');
    } else {
      navigate('/login', { state: { from: '/dashboard/events' } });
    }
  };

  // Filtrar eventos
  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      categoryFilter === 'all' || event.event_type === categoryFilter;
    
    const matchesState = 
      stateFilter === 'all' || event.state === stateFilter;
    
    return matchesSearch && matchesCategory && matchesState;
  });

  const isEventExpired = (event: Event) => {
    const referenceDate = event.end_date || event.start_date;
    if (!referenceDate) return false;
    const date = new Date(referenceDate);
    if (Number.isNaN(date.getTime())) return false;
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay.getTime() < Date.now();
  };

  const { activeEvents, expiredEvents } = useMemo(() => {
    return filteredEvents.reduce(
      (acc, event) => {
        if (isEventExpired(event)) {
          acc.expiredEvents.push(event);
        } else {
          acc.activeEvents.push(event);
        }
        return acc;
      },
      { activeEvents: [] as Event[], expiredEvents: [] as Event[] }
    );
  }, [filteredEvents]);

  // Tipos de evento disponíveis
  const eventTypes = [
    'Competição',
    'Leilão',
    'Exposição',
    'Copa',
    'Curso',
    'Encontro',
    'Outro'
  ];

  // Estados únicos dos eventos
  const states = [...new Set(events.map(e => e.state).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-between max-w-6xl mx-auto mb-6">
            <div className="flex-1"></div>
            <div className="flex-1 flex justify-center">
              <h1 className="text-4xl font-bold text-gray-900">Eventos</h1>
            </div>
            <div className="flex-1 flex justify-end">
              <Button 
                onClick={handleCreateEvent}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Criar Evento
              </Button>
            </div>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubra competições, leilões, cursos e eventos do mundo equestre
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                Filtros
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar eventos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de Evento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {eventTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select value={stateFilter} onValueChange={setStateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os estados</SelectItem>
                      {states.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </div>

          {/* Events Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {isLoading ? 'Carregando...' : `${filteredEvents.length} eventos encontrados`}
              </h2>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="h-96 animate-pulse bg-gray-100" />
                ))}
              </div>
            ) : (
              <div className="space-y-10">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Eventos ativos
                    </h3>
                    <span className="text-sm text-gray-500">
                      {activeEvents.length} encontrados
                    </span>
                  </div>
                  {activeEvents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-fr">
                      {activeEvents.map((event) => (
                        <EventCard key={event.id} event={event} status="active" />
                      ))}
                    </div>
                  ) : (
                    <Card className="p-6 text-center text-gray-600">
                      Nenhum evento ativo com esses filtros.
                    </Card>
                  )}
                </div>

                {expiredEvents.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-700">
                        Eventos encerrados
                      </h3>
                      <span className="text-sm text-gray-500">
                        {expiredEvents.length} encontrados
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-fr">
                      {expiredEvents.map((event) => (
                        <EventCard key={event.id} event={event} status="ended" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {filteredEvents.length === 0 && (
              <Card className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhum evento encontrado
                  </h3>
                  <p className="text-gray-600">
                    Tente ajustar os filtros para encontrar eventos.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
