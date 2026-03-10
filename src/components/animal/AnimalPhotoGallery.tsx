import React, { useEffect, useMemo, useState } from 'react';
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

  const primaryImage = useMemo(() => images[0] ?? '', [images]);

  useEffect(() => {
    setCurrentIndex(0);
    onIndexChange?.(0);
  }, [images.length, primaryImage, onIndexChange]);

  const handlePrev = () => {
    if (images.length <= 1) return;
    setCurrentIndex(prev => {
      const next = (prev - 1 + images.length) % images.length;
      onIndexChange?.(next);
      return next;
    });
  };

  const handleNext = () => {
    if (images.length <= 1) return;
    setCurrentIndex(prev => {
      const next = (prev + 1) % images.length;
      onIndexChange?.(next);
      return next;
    });
  };

  const handleSelect = (index: number) => {
    setCurrentIndex(index);
    onIndexChange?.(index);
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="relative">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
          <LazyImage
            src={images[currentIndex]}
            alt={`${alt} - Foto ${currentIndex + 1}`}
            className="h-full w-full object-contain"
            fallbackSrc="/placeholder-horse.jpg"
          />
        </div>

        {images.length > 1 && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-lg hover:bg-white"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-lg hover:bg-white"
              onClick={handleNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => handleSelect(index)}
              className={cn(
                'h-16 w-24 overflow-hidden rounded-lg border transition',
                index === currentIndex
                  ? 'border-orange-500 ring-2 ring-orange-200'
                  : 'border-transparent hover:border-slate-300'
              )}
            >
              <img
                src={image}
                alt={`${alt} - Miniatura ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnimalPhotoGallery;
