import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Mock data para leilões
const mockAuctions = [
  {
    id: '1',
    name: 'LEILÃO L.Z. E OLIVEIRA',
    flyerImage: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=600&h=400&fit=crop',
    date: '2024-09-25',
    time: '20:00',
    harasName: 'Haras L.Z. Oliveira',
    city: 'São Paulo',
    state: 'SP',
    type: 'Online'
  },
  {
    id: '2',
    name: 'LEILÃO LE CANTON',
    flyerImage: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&h=400&fit=crop',
    date: '2024-10-04',
    time: '15:00',
    harasName: 'Haras Le Canton',
    city: 'Teresópolis',
    state: 'RJ',
    type: 'Presencial'
  },
  {
    id: '3',
    name: '1° LEILÃO HARAS SPARTACCUS',
    flyerImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop',
    date: '2024-10-04',
    time: '20:00',
    harasName: 'Haras Spartaccus',
    city: 'Campinas',
    state: 'SP',
    type: 'Online'
  },
  {
    id: '4',
    name: 'LEILÃO ELITE RACING',
    flyerImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
    date: '2024-10-15',
    time: '19:00',
    harasName: 'Haras Elite Racing',
    city: 'Curitiba',
    state: 'PR',
    type: 'Presencial'
  },
  {
    id: '5',
    name: 'LEILÃO MANGALARGA PREMIUM',
    flyerImage: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=600&h=400&fit=crop',
    date: '2024-10-20',
    time: '16:00',
    harasName: 'Fazenda Mangalarga Premium',
    city: 'Belo Horizonte',
    state: 'MG',
    type: 'Híbrido'
  },
  {
    id: '6',
    name: 'LEILÃO QUARTO DE MILHA',
    flyerImage: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&h=400&fit=crop',
    date: '2024-10-25',
    time: '18:00',
    harasName: 'Haras Quarto de Milha',
    city: 'Porto Alegre',
    state: 'RS',
    type: 'Online'
  }
];

interface BoostedEvent {
  id: string;
  title: string;
  event_type: string | null;
  start_date: string;
  city: string | null;
  state: string | null;
  cover_image_url: string | null;
  organizer_property: string;
}

const AuctionCarousel = () => {
  const [boostedEvents, setBoostedEvents] = useState<BoostedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBoostedEvents();
  }, []);

  const loadBoostedEvents = async () => {
    try {
      setIsLoading(true);
      
      // Buscar apenas eventos turbinados ativos na home
      const { data, error } = await supabase
        .from('events')
        .select('id, title, event_type, start_date, city, state, cover_image_url, organizer_property, is_boosted, boost_expires_at, published_at')
        .eq('ad_status', 'active')
        .eq('is_boosted', true)
        .gt('boost_expires_at', new Date().toISOString())
        .order('published_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      setBoostedEvents(data || []);
    } catch (error) {
      console.error('Erro ao carregar eventos em destaque:', error);
      setBoostedEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTypeColor = (type: string | null) => {
    switch (type) {
      case 'leilao':
        return 'bg-blue-500';
      case 'exposicao':
        return 'bg-green-500';
      case 'competicao':
        return 'bg-purple-500';
      case 'curso':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeLabel = (type: string | null) => {
    switch (type) {
      case 'leilao':
        return 'Leilão';
      case 'exposicao':
        return 'Exposição';
      case 'competicao':
        return 'Competição';
      case 'curso':
        return 'Curso';
      case 'copa':
        return 'Copa';
      default:
        return 'Evento';
    }
  };
  
  // Se não há eventos impulsionados, não mostrar a seção
  if (!isLoading && boostedEvents.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16">
      <div className="container-responsive">
        <div className="mb-6 sm:mb-8">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-purple-600 mb-1.5 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Não perca
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Eventos e leilões em breve
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="relative">
            <Carousel
              opts={{
                align: "start",
                loop: boostedEvents.length > 3,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {boostedEvents.map((event) => (
                  <CarouselItem key={event.id} className="pl-2 md:pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 h-full flex">
                    <Link to={`/eventos/${event.id}`} className="block w-full">
                      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full min-h-[420px]">
                        {/* Cover Image */}
                        <div className="relative flex-shrink-0">
                          {event.cover_image_url ? (
                            <img
                              src={event.cover_image_url}
                              alt={event.title}
                              width={400}
                              height={192}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                              <Calendar className="h-16 w-16 text-white opacity-50" />
                            </div>
                          )}
                          {/* Type Badge */}
                          {event.event_type && (
                            <div className="absolute top-2 left-2">
                              <div className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${getTypeColor(event.event_type)}`}>
                                {getTypeLabel(event.event_type)}
                              </div>
                            </div>
                          )}
                          {/* Boost Badge */}
                          <div className="absolute top-2 right-2">
                            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-semibold">
                              Destaque
                            </div>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="p-4 space-y-3 flex flex-col flex-grow">
                          {/* Título */}
                          <h3 className="font-bold text-slate-900 text-lg hover:text-blue-600 transition-colors line-clamp-2">
                            {event.title}
                          </h3>
                          
                          {/* Data */}
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(event.start_date)}</span>
                          </div>
                          
                          {/* Organizador */}
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <Building2 className="h-4 w-4 flex-shrink-0" />
                            <span className="break-words line-clamp-2" title={event.organizer_property}>
                              {event.organizer_property || 'Organizador'}
                            </span>
                          </div>
                          
                          {/* Localização */}
                          {event.city && event.state && (
                            <div className="flex items-center space-x-2 text-sm text-slate-600 pt-2 border-t border-slate-100 mt-auto overflow-hidden">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{event.city}, {event.state}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </CarouselItem>
                ))}
            </CarouselContent>
            
            {/* Navigation Arrows */}
            {boostedEvents.length > 3 && (
              <div className="hidden sm:block">
                <CarouselPrevious className="absolute -left-6 top-1/2 -translate-y-1/2 bg-white border-2 border-slate-200 shadow-xl hover:shadow-2xl hover:border-slate-400 hover:text-slate-600 transition-all duration-300 w-12 h-12" />
                <CarouselNext className="absolute -right-6 top-1/2 -translate-y-1/2 bg-white border-2 border-slate-200 shadow-xl hover:shadow-2xl hover:border-slate-400 hover:text-slate-600 transition-all duration-300 w-12 h-12" />
              </div>
            )}
          </Carousel>
        </div>
        )}
      </div>
    </section>
  );
};

export default AuctionCarousel;
