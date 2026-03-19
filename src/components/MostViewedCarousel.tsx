import React, { useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Heart, MapPin, Calendar, Users, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { analyticsService } from '@/services/analyticsService';
import { animalService } from '@/services/animalService';
import { getAge } from '@/utils/animalAge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import PhotoGallery from '@/components/PhotoGallery';
import { supabase } from '@/lib/supabase';
import { AnimalCardData, getPlaceholderGallery, mapAnimalRecordToCard } from '@/utils/animalCard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryWithSession } from '@/lib/queryWithSession';

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
      { carouselName: 'most_viewed_carousel', carouselPosition: carouselIndex + 1 }
    );
    return cleanup;
  }, [animalId, carouselIndex]);

  return (
    <div ref={elementRef} onClick={onAnimalClick} className="h-full flex">
      {children}
    </div>
  );
});
AnimalImpressionTracker.displayName = 'AnimalImpressionTracker';

const MostViewedCarousel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const queryClient = useQueryClient();

  const { data: rawData, isLoading, error: queryError } = useQuery({
    queryKey: ['most-viewed-animals', 10],
    queryFn: async () => {
      let list = await queryWithSession(() => animalService.getMostViewedAnimals(10));
      if (!list || list.length === 0) {
        list = await animalService.getRecentAnimals(10);
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

  const mostViewed = useMemo(
    () => (rawData || []).map(mapAnimalRecordToCard),
    [rawData]
  );
  const error = queryError ? 'Não conseguimos carregar os animais mais buscados agora.' : null;

  // Realtime: invalidar cache quando clicks ou animais mudam
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;
    const debouncedInvalidate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['most-viewed-animals'] });
      }, 500);
    };

    const clicksChannel = supabase
      .channel('home-most-viewed-clicks')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'clicks', filter: 'content_type=eq.animal' },
        debouncedInvalidate
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[MostViewedCarousel] Clicks subscription falhou:', status, err);
          setTimeout(() => clicksChannel.subscribe(), 2000);
        }
      });

    const animalsChannel = supabase
      .channel('home-most-viewed-animals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'animals' }, debouncedInvalidate)
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[MostViewedCarousel] Animals subscription falhou:', status, err);
          setTimeout(() => animalsChannel.subscribe(), 2000);
        }
      });

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(clicksChannel);
      supabase.removeChannel(animalsChannel);
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
  
  const resolveGallery = (animal: AnimalCardData) =>
    animal.images.length > 0 ? animal.images : getPlaceholderGallery();

  return (
    <section className="bg-slate-50 py-16">
      <div className="container-responsive">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">
            Animais mais buscados
          </h2>
          <Button
            variant="outline"
            onClick={() => navigate('/buscar?sortBy=views')}
            className="flex items-center gap-2"
          >
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          {error && (
            <p className="text-sm text-red-600 mb-6">{error}</p>
          )}
          {isLoading && mostViewed.length === 0 ? (
            <p className="text-sm text-slate-500">Carregando ranking...</p>
          ) : mostViewed.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum animal com cliques suficientes no momento.</p>
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
              {mostViewed.map((horse, index) => (
                <CarouselItem key={horse.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 h-full flex">
                  <AnimalImpressionTracker 
                    animalId={horse.id}
                    carouselIndex={index}
                    onAnimalClick={() => {
                      analyticsService.recordClick('animal', horse.id);
                    }}
                  >
                    <Link to={`/animal/${horse.id}`} className="block w-full">
                      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full min-h-[520px]" style={{ contain: 'layout' }}>
                      {/* Image Gallery */}
                      <div className="relative flex-shrink-0">
                        <div className="aspect-square overflow-hidden">
                          <PhotoGallery
                            images={resolveGallery(horse)}
                            alt={horse.name}
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                      
                      {/* Content - Informações organizadas verticalmente */}
                      <div className="p-4 space-y-3 flex flex-col flex-grow">
                        {/* Nome do Animal */}
                        <h3 className="font-bold text-slate-900 text-lg hover:text-blue-600 transition-colors">
                          {horse.name}
                        </h3>
                      
                      {/* Raça */}
                      <div className="text-sm text-slate-600">
                        <span className="font-medium">{horse.breed}</span>
                      </div>
                      
                      {/* Pelagem */}
                      <div className="text-sm text-slate-600">
                        <span>{horse.coat}</span>
                      </div>
                      
                      {/* Idade */}
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Calendar className="h-4 w-4" />
                        <span>{getAge(horse.birthDate)}</span>
                      </div>
                      
                      {/* Gender */}
                      <div className={`font-semibold text-sm ${
                        horse.gender === 'Macho' 
                          ? 'text-blue-600' 
                          : 'text-pink-600'
                      }`}>
                        {horse.gender === 'Macho' ? '♂ Macho' : '♀ Fêmea'}
                      </div>
                      
                      {/* Criador - Haras ou Perfil Pessoal */}
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span className="break-words line-clamp-2" title={horse.harasName}>
                          {horse.harasName}
                        </span>
                      </div>
                      
                      {/* Localização e Favorito - Na mesma linha */}
                      <div className="flex items-center justify-between text-sm text-slate-600 pt-2 border-t border-slate-100 mt-auto overflow-hidden">
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{horse.currentLocation.city}, {horse.currentLocation.state}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:text-red-500 transition-colors"
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
        </div>
      </div>
    </section>
  );
};

export default MostViewedCarousel;