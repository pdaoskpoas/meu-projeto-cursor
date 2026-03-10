import React from "react";
import SponsorService from '@/services/sponsorService';

export interface Logo {
  name: string;
  id: number;
  img: React.ComponentType<React.SVGProps<SVGSVGElement>> | string;
  url?: string;
  sponsorId?: string;
}

interface LogoCarouselProps {
  logos: Logo[];
  speed?: number; // pixels por segundo
}

export function LogoCarousel({ logos, speed = 30 }: LogoCarouselProps) {
  // Duplicar os logos 3 vezes para garantir scroll infinito suave
  const duplicatedLogos = [...logos, ...logos, ...logos];

  const handleLogoClick = (logo: Logo) => {
    // Registrar clique no analytics
    if (logo.sponsorId) {
      SponsorService.recordClick(logo.sponsorId);
    }

    // Abrir URL se disponível
    if (logo.url) {
      window.open(logo.url, '_blank', 'noopener,noreferrer');
    }
  };

  const renderLogoImage = (logo: Logo) => {
    if (typeof logo.img === 'string') {
      // URL de imagem do Supabase
      return (
        <img 
          src={logo.img} 
          alt={logo.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
        />
      );
    } else {
      // Componente SVG
      const LogoComponent = logo.img;
      return (
        <LogoComponent 
          className="w-full h-full object-contain opacity-70 hover:opacity-100 transition-opacity duration-300" 
          aria-label={logo.name}
        />
      );
    }
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Gradientes laterais para efeito fade */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* Container do carrossel */}
      <div className="flex hover:pause-animation">
        <div 
          className="flex gap-8 sm:gap-12 animate-scroll"
          style={{
            animationDuration: `${(logos.length * 200) / speed}s`,
          }}
        >
          {duplicatedLogos.map((logo, index) => (
            <div
              key={`${logo.id}-${index}`}
              className="flex-shrink-0 w-40 sm:w-48 lg:w-56 h-20 sm:h-24 flex items-center justify-center cursor-pointer"
              onClick={() => handleLogoClick(logo)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleLogoClick(logo);
                }
              }}
            >
              {renderLogoImage(logo)}
            </div>
          ))}
        </div>

        {/* Segunda faixa para garantir scroll contínuo sem gaps */}
        <div 
          className="flex gap-8 sm:gap-12 animate-scroll"
          style={{
            animationDuration: `${(logos.length * 200) / speed}s`,
          }}
          aria-hidden="true"
        >
          {duplicatedLogos.map((logo, index) => (
            <div
              key={`duplicate-${logo.id}-${index}`}
              className="flex-shrink-0 w-40 sm:w-48 lg:w-56 h-20 sm:h-24 flex items-center justify-center cursor-pointer"
              onClick={() => handleLogoClick(logo)}
            >
              {renderLogoImage(logo)}
            </div>
          ))}
        </div>
      </div>

      {/* CSS para animação infinita */}
      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: scroll linear infinite;
          will-change: transform;
        }

        .hover\\:pause-animation:hover .animate-scroll {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
