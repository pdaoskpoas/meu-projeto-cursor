import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  skeletonClassName = '',
  fallbackSrc = '',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = observerRef.current;
    if (!element) {
      return;
    }

    let observer: IntersectionObserver | null = null;

    try {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            try {
              if (entry.isIntersecting) {
                setIsInView(true);
                // Uma vez que a imagem entra em view, mantém carregada
                // Isso previne "piscadas" durante transições de carrossel
                if (observer) {
                  observer.unobserve(entry.target);
                }
              }
            } catch (err) {
              console.warn('Error in LazyImage observer:', err);
            }
          });
        },
        {
          threshold: 0.01, // Threshold mais baixo para detectar mais cedo
          rootMargin: '400px' // Margem maior para pré-carregar imagens adjacentes no carrossel
        }
      );

      observer.observe(element);
    } catch (err) {
      console.warn('Error creating LazyImage observer:', err);
      // Fallback: mostrar imagem imediatamente
      setIsInView(true);
    }

    return () => {
      try {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
      } catch (err) {
        console.warn('Error disconnecting LazyImage observer:', err);
      }
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const imageSrc = hasError && fallbackSrc ? fallbackSrc : src;

  return (
    <div ref={observerRef} className={cn('relative overflow-hidden', className)}>
      {/* Skeleton Loading - Só mostra enquanto não carregou, independente de estar em view */}
      {!isLoaded && isInView && (
        <div className={cn(
          'absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse',
          skeletonClassName
        )} />
      )}

      {/* Actual Image */}
      {isInView && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          className={cn(
            'transition-opacity duration-200',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}

      {/* Error State */}
      {hasError && !fallbackSrc && (
        <div className={cn(
          'absolute inset-0 bg-slate-100 flex items-center justify-center',
          className
        )}>
          <div className="text-center text-slate-500">
            <div className="w-8 h-8 mx-auto mb-2 bg-slate-300 rounded"></div>
            <p className="text-xs">Erro ao carregar</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;




