import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LazyImage from '@/components/ui/LazyImage';
import { cn } from '@/lib/utils';

interface AnimalPhotoGalleryProps {
  images: string[];
  alt: string;
  onIndexChange?: (index: number) => void;
  className?: string;
}

const AnimalPhotoGallery: React.FC<AnimalPhotoGalleryProps> = ({
  images,
  alt,
  onIndexChange,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const minSwipeDistance = 50;

  const primaryImage = useMemo(() => images[0] ?? '', [images]);

  useEffect(() => {
    setCurrentIndex(0);
    onIndexChange?.(0);
  }, [images.length, primaryImage, onIndexChange]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex(prev => {
      const next = (prev - 1 + images.length) % images.length;
      onIndexChange?.(next);
      return next;
    });
  }, [images.length, onIndexChange]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex(prev => {
      const next = (prev + 1) % images.length;
      onIndexChange?.(next);
      return next;
    });
  }, [images.length, onIndexChange]);

  const handleSelect = (index: number) => {
    setCurrentIndex(index);
    onIndexChange?.(index);
  };

  // Touch/Swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    if (images.length <= 1) return;
    
    const distance = touchStartX.current - touchEndX.current;
    
    if (Math.abs(distance) >= minSwipeDistance) {
      if (distance > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  }, [images.length, handleNext, handlePrev]);

  // Scroll thumbnail into view when index changes
  useEffect(() => {
    if (thumbnailsRef.current) {
      const activeThumb = thumbnailsRef.current.children[currentIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3 sm:space-y-4', className)}>
      {/* Main image with swipe */}
      <div 
        className="relative touch-manipulation"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
          <LazyImage
            src={images[currentIndex]}
            alt={`${alt} - Foto ${currentIndex + 1}`}
            className="h-full w-full object-contain"
            fallbackSrc="/placeholder-horse.jpg"
          />
          {/* Contador de fotos mobile */}
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {images.length > 1 && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-lg hover:bg-white"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-lg hover:bg-white"
              onClick={handleNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnails — scroll horizontal em mobile */}
      {images.length > 1 && (
        <div 
          ref={thumbnailsRef}
          className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => handleSelect(index)}
              className={cn(
                'h-14 w-20 sm:h-16 sm:w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition',
                index === currentIndex
                  ? 'border-orange-500 ring-2 ring-orange-200'
                  : 'border-transparent hover:border-slate-300'
              )}
            >
              <img
                src={image}
                alt={`${alt} - Miniatura ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnimalPhotoGallery;
