import React from 'react';
import { Link } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const BreedShowcase = () => {
  const breeds = [
    {
      id: 'mangalarga-marchador',
      name: 'Mangalarga Marchador',
      image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=250&fit=crop',
    },
    {
      id: 'thoroughbred',
      name: 'Thoroughbred',
      image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&h=250&fit=crop',
    },
    {
      id: 'quarter-horse',
      name: 'Quarter Horse',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop',
    },
    {
      id: 'crioulo',
      name: 'Crioulo',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop',
    },
    {
      id: 'arabian',
      name: 'Árabe',
      image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=250&fit=crop',
    },
    {
      id: 'appaloosa',
      name: 'Appaloosa',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop',
    },
    {
      id: 'paint-horse',
      name: 'Paint Horse',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop',
    },
    {
      id: 'mustang',
      name: 'Mustang',
      image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=250&fit=crop',
    }
  ];

  return (
    <section className="bg-white py-4 sm:py-6 lg:py-8 pt-6 sm:pt-8 lg:pt-12">
      <div className="container-responsive">

        {/* Single Line Carousel - Responsive */}
        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-1 sm:-ml-2">
              {breeds.map((breed) => (
                <CarouselItem key={breed.id} className="pl-1 sm:pl-2 basis-auto">
                  <Link 
                    to={`/buscar/${breed.id}`} 
                    className="group block"
                  >
                    <div className="flex items-center space-x-1.5 sm:space-x-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-md sm:rounded-lg px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 transition-all duration-200 whitespace-nowrap">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs"></span>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-slate-700 group-hover:text-blue-700">
                        {breed.name}
                      </span>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
              {/* Ver Todas - Como último item do carousel */}
              <CarouselItem className="pl-1 sm:pl-2 basis-auto">
                <Link 
                  to="/categorias" 
                  className="group block"
                >
                  <div className="flex items-center space-x-1.5 sm:space-x-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-400 rounded-md sm:rounded-lg px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 transition-all duration-200 whitespace-nowrap">
                    <span className="text-xs sm:text-sm font-medium text-blue-700 group-hover:text-blue-800">
                      Ver todas →
                    </span>
                  </div>
                </Link>
              </CarouselItem>
            </CarouselContent>
            
            {/* Navigation Arrows - Responsive */}
            <CarouselPrevious className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 bg-white border border-slate-300 shadow-md hover:shadow-lg hover:border-slate-400 transition-all duration-200 w-6 h-6 sm:w-8 sm:h-8" />
            <CarouselNext className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 bg-white border border-slate-300 shadow-md hover:shadow-lg hover:border-slate-400 transition-all duration-200 w-6 h-6 sm:w-8 sm:h-8" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default BreedShowcase;
