import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Heart, MapPin, Calendar, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useMostViewedAnimals } from '@/hooks/useMostViewedAnimals';
import { analyticsService } from '@/services/analyticsService';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import PhotoGallery from '@/components/PhotoGallery';
import { getAge } from '@/utils/animalAge';
import { getPlaceholderGallery } from '@/utils/animalCard';
import CarouselSwipeIndicator from '@/components/ui/CarouselSwipeIndicator';

// 🔒 Componente seguro: rastreia impressões via Supabase
const AnimalImpressionTracker: React.FC<{ 
  animalId: string; 
  children: React.ReactNode;
  onAnimalClick: () => void;
  carouselIndex: number;
}> = ({ animalId, children, onAnimalClick, carouselIndex }) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;
    // Usar analyticsService que já grava no Supabase
    const cleanup = analyticsService.observeElementImpression(
      elementRef.current,
      'animal',
      animalId,
      undefined,
      { carouselName: 'monthly_top_animals', carouselPosition: carouselIndex + 1 }
    );
    return cleanup;
  }, [animalId, carouselIndex]);

  return (
    <div ref={elementRef} onClick={onAnimalClick}>
      {children}
    </div>
  );
};

const MostViewedThisMonthCarousel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { animals: displayHorses, isLoading, error } = useMostViewedAnimals(6, 'month');

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
  
  return (
    <section className="bg-slate-50 py-16">
      <div className="container-responsive">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Animais mais buscados do mês
          </h2>
        </div>

        <div className="relative">
          {isLoading && (
            <div className="mb-6 flex items-center gap-3 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Carregando ranking mensal...</span>
            </div>
          )}
          {!isLoading && error && (
            <p className="mb-6 text-sm text-red-600">
              Nao foi possivel carregar os dados do mes agora.
            </p>
          )}
          {!isLoading && !error && displayHorses.length === 0 && (
            <p className="mb-6 text-sm text-slate-500">
              Ainda nao ha dados suficientes para este ranking mensal.
            </p>
          )}
          {displayHorses.length > 0 && (
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
              {displayHorses.map((horse, index) => (
                <CarouselItem key={horse.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <AnimalImpressionTracker 
                    animalId={horse.id}
                    carouselIndex={index}
                    onAnimalClick={() => {}}
                  >
                    <Link to={`/animal/${horse.id}`} className="block w-full">
                      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
                      {/* Image Gallery */}
                      <div className="relative flex-shrink-0">
                        <div className="aspect-square overflow-hidden">
                          <PhotoGallery
                            images={horse.images?.length ? horse.images : getPlaceholderGallery()}
                            alt={horse.name}
                            className="w-full h-full"
                          />
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
                        <span>{getAge(horse.birth_date)}</span>
                      </div>

                      {/* Criador */}
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Users className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{horse.haras_name || 'Perfil do anunciante'}</span>
                      </div>

                      {/* Localização e Favorito */}
                      <div className="flex items-center justify-between text-sm text-slate-500 pt-2 border-t border-slate-100 mt-auto">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">
                            {horse.current_city || 'Cidade nao informada'}, {horse.current_state || 'UF'}
                          </span>
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
          <CarouselSwipeIndicator />
        </div>
      </div>
    </section>
  );
};

export default MostViewedThisMonthCarousel;
