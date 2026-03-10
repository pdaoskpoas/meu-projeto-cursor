import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Mock data para haras verificados
const mockVerifiedHaras = [
  {
    id: '1',
    name: 'Haras Elite Racing',
    logo: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=200&h=200&fit=crop&auto=format'
  },
  {
    id: '2',
    name: 'Haras Le Canton',
    logo: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=200&h=200&fit=crop&auto=format'
  },
  {
    id: '3',
    name: 'Haras Spartaccus',
    logo: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop&auto=format'
  },
  {
    id: '4',
    name: 'Fazenda Mangalarga Premium',
    logo: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&auto=format'
  },
  {
    id: '5',
    name: 'Haras Quarto de Milha',
    logo: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=200&h=200&fit=crop&auto=format'
  },
  {
    id: '6',
    name: 'Haras L.Z. Oliveira',
    logo: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=200&h=200&fit=crop&auto=format'
  },
  {
    id: '7',
    name: 'Fazenda Crioulo Sul',
    logo: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop&auto=format'
  },
  {
    id: '8',
    name: 'Haras Árabe Premium',
    logo: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&auto=format'
  }
];

const VerifiedHarasCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const itemsPerSlide = 6; // Número de itens visíveis por slide
  const totalSlides = Math.ceil(mockVerifiedHaras.length / itemsPerSlide);

  return (
    <section className="bg-slate-50 py-8">
      <div className="container-responsive">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Perfis Institucionais Verificados
          </h2>
        </div>

        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
            onSlideChange={(index) => setCurrentSlide(index)}
          >
            <CarouselContent className="-ml-0">
              {mockVerifiedHaras.map((haras) => (
                <CarouselItem key={haras.id} className="pl-0 basis-1/6">
                  <Link to={`/haras/${haras.id}`} className="block text-center">
                    <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-slate-200 hover:border-blue-300 transition-colors hover:shadow-lg">
                      <img
                        src={haras.logo}
                        alt={`Logo ${haras.name}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-2 px-1">
                      <p className="text-xs text-slate-700 font-medium truncate" title={haras.name}>
                        {haras.name}
                      </p>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Navigation Arrows */}
            <div className="hidden sm:block">
              <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white border-2 border-slate-200 shadow-lg hover:shadow-xl hover:border-slate-400 hover:text-slate-600 transition-all duration-300 w-10 h-10" />
              <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white border-2 border-slate-200 shadow-lg hover:shadow-xl hover:border-slate-400 hover:text-slate-600 transition-all duration-300 w-10 h-10" />
            </div>
          </Carousel>
          
          {/* Pagination Dots */}
          <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VerifiedHarasCarousel;
