import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SponsorService from '@/services/sponsorService';

export interface Logo {
  name: string;
  id: number;
  img: React.ComponentType<React.SVGProps<SVGSVGElement>> | string;
  url?: string;
  sponsorId?: string;
  linkedProfileId?: string;
  clickActionEnabled?: boolean;
}

interface LogoCarouselProps {
  logos: Logo[];
  speed?: number; // pixels por segundo
}

function SponsorLogoImage({ src, alt }: { src: string; alt: string }) {
  const [isSquare, setIsSquare] = useState(false);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const ratio = naturalWidth / naturalHeight;
    setIsSquare(ratio >= 0.8 && ratio <= 1.25);
  };

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={handleLoad}
      className={`w-full h-full object-contain opacity-70 hover:opacity-100 transition-opacity duration-300${isSquare ? ' rounded-full' : ''}`}
    />
  );
}

export function LogoCarousel({ logos, speed = 30 }: LogoCarouselProps) {
  const navigate = useNavigate();
  // Duplicar os logos 3 vezes para garantir scroll infinito suave
  const duplicatedLogos = [...logos, ...logos, ...logos];

  const handleLogoClick = (logo: Logo) => {
    if (!logo.clickActionEnabled) return;

    if (logo.sponsorId) {
      SponsorService.recordClick(logo.sponsorId);
    }

    // Perfil interno tem prioridade sobre website externo
    if (logo.linkedProfileId) {
      navigate(`/haras/${logo.linkedProfileId}`);
    } else if (logo.url) {
      window.open(logo.url, '_blank', 'noopener,noreferrer');
    }
  };

  const renderLogoImage = (logo: Logo) => {
    if (typeof logo.img === 'string') {
      return <SponsorLogoImage src={logo.img} alt={logo.name} />;
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
          {duplicatedLogos.map((logo, index) => {
            const isClickable = logo.clickActionEnabled && (logo.linkedProfileId || logo.url);
            return (
              <div
                key={`${logo.id}-${index}`}
                className={`flex-shrink-0 w-40 sm:w-48 lg:w-56 h-20 sm:h-24 flex items-center justify-center${isClickable ? ' cursor-pointer' : ''}`}
                onClick={() => handleLogoClick(logo)}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={isClickable ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleLogoClick(logo);
                } : undefined}
              >
                {renderLogoImage(logo)}
              </div>
            );
          })}
        </div>

        {/* Segunda faixa para garantir scroll contínuo sem gaps */}
        <div
          className="flex gap-8 sm:gap-12 animate-scroll"
          style={{
            animationDuration: `${(logos.length * 200) / speed}s`,
          }}
          aria-hidden="true"
        >
          {duplicatedLogos.map((logo, index) => {
            const isClickable = logo.clickActionEnabled && (logo.linkedProfileId || logo.url);
            return (
              <div
                key={`duplicate-${logo.id}-${index}`}
                className={`flex-shrink-0 w-40 sm:w-48 lg:w-56 h-20 sm:h-24 flex items-center justify-center${isClickable ? ' cursor-pointer' : ''}`}
                onClick={() => handleLogoClick(logo)}
              >
                {renderLogoImage(logo)}
              </div>
            );
          })}
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
