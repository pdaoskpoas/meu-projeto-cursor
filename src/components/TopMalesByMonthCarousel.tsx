import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Calendar, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useTopAnimalsByGender } from '@/hooks/useTopAnimalsByGender';
import { AnimalImpressionTracker } from '@/components/tracking/AnimalImpressionTracker';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import PhotoGallery from '@/components/PhotoGallery';
import { getAge } from '@/utils/animalAge';
import { getPlaceholderGallery, mapAnimalRecordToCard } from '@/utils/animalCard';

const TopMalesByMonthCarousel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { animals, isLoading, error } = useTopAnimalsByGender('Macho', 10, 'month');
  const displayHorses = useMemo(() => animals.map(mapAnimalRecordToCard), [animals]);

  const handleFavoriteClick = async (e: React.MouseEvent, horseId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (user) {
      await toggleFavorite(horseId);
    } else {
      navigate('/login');
    }
  };
  
  const resolveGallery = (horse: ReturnType<typeof mapAnimalRecordToCard>) =>
    horse.images.length > 0 ? horse.images : getPlaceholderGallery();

  return (
    <section className="bg-white py-16">
      <div className="container-responsive">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">
            Garanhões mais buscados do mês
          </h2>
          <Button
            variant="outline"
            onClick={() => navigate('/buscar?gender=Macho&sortBy=views')}
            className="flex items-center gap-2"
          >
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          {error && <p className="text-sm text-red-600 mb-6">{error.message}</p>}
          {isLoading && displayHorses.length === 0 ? (
            <p className="text-sm text-slate-500">Carregando ranking mensal...</p>
          ) : displayHorses.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum clique registrado este mês.</p>
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
              {displayHorses.map((horse, index) => (
                <CarouselItem key={horse.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 h-full flex">
                  <AnimalImpressionTracker 
                    animalId={horse.id}
                    carouselIndex={index}
                    carouselName="top_males_month"
                    onAnimalClick={() => {}}
                  >
                    <Link to={`/animal/${horse.id}`} className="block w-full">
                      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full min-h-[520px]">
                      {/* Image Gallery */}
                      <div className="relative flex-shrink-0">
                        <div className="aspect-square overflow-hidden">
                          <PhotoGallery images={resolveGallery(horse)} alt={horse.name} className="w-full h-full" />
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
                      <div className="font-semibold text-sm text-blue-600">
                        ♂ Macho
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

export default TopMalesByMonthCarousel;

