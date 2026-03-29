import React, { useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Heart, MapPin, Calendar, Users, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { analyticsService } from '@/services/analyticsService';
import { animalService } from '@/services/animalService';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import PhotoGallery from '@/components/PhotoGallery';
import { getAge } from '@/utils/animalAge';
import { supabase } from '@/lib/supabase';
import { AnimalCardData, getPlaceholderGallery, mapAnimalRecordToCard, normalizeSupabaseImages } from '@/utils/animalCard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryWithSession } from '@/lib/queryWithSession';
import CarouselSwipeIndicator from '@/components/ui/CarouselSwipeIndicator';

// Componente para rastrear impressões via Supabase Analytics
const AnimalImpressionTracker: React.FC<{
  animalId: string;
  children: React.ReactNode;
  onAnimalClick: () => void;
  carouselIndex: number;
}> = React.memo(({ animalId, children, onAnimalClick, carouselIndex }) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;
    const cleanup = analyticsService.observeElementImpression(
      elementRef.current,
      'animal',
      animalId,
      undefined,
      { carouselName: 'recent_carousel', carouselPosition: carouselIndex + 1 }
    );
    return cleanup;
  }, [animalId, carouselIndex]);

  return (
    <div ref={elementRef} onClick={onAnimalClick}>
      {children}
    </div>
  );
});
AnimalImpressionTracker.displayName = 'AnimalImpressionTracker';

const RecentlyPublishedCarousel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const queryClient = useQueryClient();

  const { data: rawData, isLoading, error: queryError } = useQuery({
    queryKey: ['recent-animals', 10],
    queryFn: async () => {
      let list = await queryWithSession(() => animalService.getRecentAnimals(10));
      if (!list || list.length === 0) {
        list = await animalService.getMostViewedAnimals(10);
      }
      if (!list || list.length === 0) {
        list = await animalService.getFeaturedAnimals(10);
      }
      return list;
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

  const recentAnimals = useMemo(
    () => (rawData || []).map((animal: Record<string, unknown>) => {
      const card = mapAnimalRecordToCard(animal);
      return { ...card, images: normalizeSupabaseImages(animal) };
    }),
    [rawData]
  );
  const error = queryError ? 'Não conseguimos carregar as últimas postagens.' : null;

  // Realtime: invalidar cache quando animais mudam
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;
    const channel = supabase
      .channel('home-recent-animals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'animals' }, () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['recent-animals'] });
        }, 500);
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[RecentCarousel] Subscription falhou:', status, err);
          setTimeout(() => channel.subscribe(), 2000);
        }
      });

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Função para lidar com favoritos
  const handleFavoriteClick = async (e: React.MouseEvent, horseId: string) => {
    e.preventDefault(); // Previne o clique no link
    e.stopPropagation(); // Previne propagação do evento
    
    if (user) {
      // Usuário logado: toggle favorito (adiciona/remove com mensagem automática)
      await toggleFavorite(horseId);
    } else {
      // Usuário não logado: redireciona para login
      navigate('/login');
    }
  };
  
  const resolveGalleryImages = (horse: AnimalCardData) =>
    horse.images.length > 0 ? horse.images : getPlaceholderGallery();

  return (
    <section className="py-12 sm:py-16">
      <div className="container-responsive">
        <div className="mb-6 sm:mb-8 flex justify-between items-center">
          <div>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-500 mb-1.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Acabaram de chegar
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Novos na Vitrine
            </h2>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/buscar?sortBy=recent')}
            className="flex items-center gap-2 font-semibold"
          >
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          {error && <p className="text-sm text-red-600 mb-6">{error}</p>}
          {isLoading && recentAnimals.length === 0 ? (
            <p className="text-sm text-slate-500">Carregando últimas publicações...</p>
          ) : recentAnimals.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum anúncio publicado recentemente.</p>
          ) : (
            <Carousel
            opts={{
              align: "start",
              loop: true,
              duration: 20, // Transição mais rápida para navegação ágil
              skipSnaps: false,
              containScroll: "trimSnaps", // Previne sobreposição
              dragFree: false, // Snap behavior mais consistente
              inViewThreshold: 0.7, // Threshold para considerar item visível
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {recentAnimals.map((horse, index) => (
                <CarouselItem key={horse.id} className="pl-2 md:pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <AnimalImpressionTracker 
                    animalId={horse.id}
                    carouselIndex={index}
                    onAnimalClick={() => {
                      analyticsService.recordClick('animal', horse.id);
                    }}
                  >
                    <Link to={`/animal/${horse.id}`} className="block w-full">
                      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
                      {/* Image Gallery */}
                      <div className="relative flex-shrink-0">
                        <div className="aspect-square overflow-hidden">
                          <PhotoGallery
                            images={resolveGalleryImages(horse)}
                            alt={horse.name}
                            className="w-full h-full"
                          />
                        </div>
                        {/* New Badge */}
                        <div className="absolute top-2 left-2 z-10">
                          <Badge className="bg-blue-500 text-white text-xs px-2 py-1">
                            <Clock className="h-3 w-3 mr-1" />
                            Novo
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2 flex flex-col flex-grow">
                        <h3 className="font-bold text-slate-900 text-lg leading-tight line-clamp-1">
                          {horse.name}
                        </h3>

                      {/* Raça · Gênero */}
                      <p className="text-sm text-slate-600 truncate">
                        <span className="font-medium">{horse.breed}</span>
                        <span className="mx-1.5 text-slate-300">·</span>
                        <span className={`font-semibold ${horse.gender === 'Macho' ? 'text-blue-600' : 'text-pink-600'}`}>
                          {horse.gender === 'Macho' ? '♂' : '♀'}
                        </span>
                      </p>

                      {/* Idade */}
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{getAge(horse.birthDate)}</span>
                      </div>

                      {/* Criador */}
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Users className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{horse.harasName}</span>
                      </div>

                      {/* Localização e Favorito */}
                      <div className="flex items-center justify-between text-sm text-slate-500 pt-2 border-t border-slate-100 mt-auto">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{horse.currentLocation.city}, {horse.currentLocation.state}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-11 w-11 sm:h-8 sm:w-8 p-0 hover:text-red-500 transition-colors flex-shrink-0"
                          onClick={(e) => handleFavoriteClick(e, horse.id)}
                          title={user ? (isFavorite(horse.id) ? "Remover dos favoritos" : "Adicionar aos favoritos") : "Faça login para favoritar"}
                        >
                          <Heart className={`h-4 w-4 ${isFavorite(horse.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                      </div>
                    </div>
                    </div>
                    </Link>
                  </AnimalImpressionTracker>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Navigation Arrows */}
            <div className="hidden sm:block">
              <CarouselPrevious className="absolute -left-6 top-1/2 -translate-y-1/2 bg-white border-2 border-slate-200 shadow-xl hover:shadow-2xl hover:border-slate-400 hover:text-slate-600 transition-all duration-300 w-12 h-12" />
              <CarouselNext className="absolute -right-6 top-1/2 -translate-y-1/2 bg-white border-2 border-slate-200 shadow-xl hover:shadow-2xl hover:border-slate-400 hover:text-slate-600 transition-all duration-300 w-12 h-12" />
            </div>
          </Carousel>
          )}
          <CarouselSwipeIndicator />
        </div>
      </div>
    </section>
  );
};

export default RecentlyPublishedCarousel;