import React, { useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, Heart, MapPin, Calendar, Users, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { analyticsService } from '@/services/analyticsService';
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
import AnimalImpressionTracker from '@/components/tracking/AnimalImpressionTracker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { animalService } from '@/services/animalService';
import { queryWithSession } from '@/lib/queryWithSession';

const FeaturedCarousel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const queryClient = useQueryClient();

  const { data: rawData, isLoading, error: queryError } = useQuery({
    queryKey: ['featured-animals', 10],
    queryFn: () => queryWithSession(() => animalService.getFeaturedAnimals(10)),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

  const featuredAnimals = useMemo(
    () => (rawData || []).map(mapAnimalRecordToCard),
    [rawData]
  );
  const error = queryError ? 'Não conseguimos carregar os turbinados agora. Tente novamente em instantes.' : null;

  // Realtime: invalidar cache quando animais mudam (boost)
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;
    const channel = supabase
      .channel('home-featured-animals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'animals' }, (payload) => {
        const affectedBoost =
          payload.new?.is_boosted !== payload.old?.is_boosted ||
          payload.new?.boost_expires_at !== payload.old?.boost_expires_at ||
          payload.eventType === 'INSERT' ||
          payload.eventType === 'DELETE';

        if (affectedBoost) {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['featured-animals'] });
          }, 500);
        }
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[FeaturedCarousel] Subscription falhou:', status, err);
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
  
  const resolveGallery = (horse: AnimalCardData) => {
    if (horse.images.length > 0) {
      return horse.images;
    }
    return getPlaceholderGallery();
  };

  const validHorses = featuredAnimals.filter((horse) => horse && horse.id);

  return (
    <section id="destaques" className="bg-white py-16">
      <div className="container-responsive">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">
            Animais em Destaque
          </h2>
          <Button
            variant="outline"
            onClick={() => navigate('/buscar?sortBy=relevant')}
            className="flex items-center gap-2"
          >
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          {error && (
            <p className="text-sm text-red-600 mb-6">
              {error}
            </p>
          )}
          {isLoading && validHorses.length === 0 ? (
            <p className="text-sm text-slate-500">Carregando turbinados...</p>
          ) : validHorses.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum animal turbinado no momento.</p>
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
            <CarouselContent className="-ml-2 md:-ml-4 carousel-mobile">
              {validHorses.map((horse, index) => (
                <CarouselItem key={horse.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 carousel-item-mobile">
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
                            images={resolveGallery(horse)}
                            alt={horse.name}
                            className="w-full h-full"
                          />
                        </div>
                        {/* Premium Badge */}
                        <div className="absolute top-2 left-2 z-10">
                          <Badge className="bg-emerald-500 text-white text-xs px-2 py-1">
                            <Crown className="h-3 w-3 mr-1" />
                            Premium
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
                          className="h-8 w-8 p-0 hover:text-red-500 transition-colors flex-shrink-0"
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

export default FeaturedCarousel;