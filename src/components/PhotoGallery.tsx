import React, { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LazyImage from '@/components/ui/LazyImage';
import { Button } from '@/components/ui/button';

interface PhotoGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ images, alt, className = "" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showArrows, setShowArrows] = useState(false);
  
  // Touch/Swipe support
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const nextImage = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToImage = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    if (images.length <= 1) return;
    
    const distance = touchStartX.current - touchEndX.current;
    
    if (Math.abs(distance) >= minSwipeDistance) {
      e.preventDefault();
      e.stopPropagation();
      if (distance > 0) {
        // Swipe left → próxima
        nextImage();
      } else {
        // Swipe right → anterior
        prevImage();
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  }, [images.length, nextImage, prevImage]);

  return (
    <div 
      className={`relative group touch-manipulation ${className}`}
      onMouseEnter={() => setShowArrows(true)}
      onMouseLeave={() => setShowArrows(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Image */}
      <LazyImage
        src={images[currentIndex]}
        alt={alt}
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        fallbackSrc="/placeholder-horse.jpg"
      />

      {/* Navigation Arrows — visíveis em hover (desktop) e sempre sutis em mobile */}
      {images.length > 1 && (
        <>
          {/* Left Arrow */}
          <Button
            size="sm"
            variant="ghost"
            className={`absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-lg transition-all duration-300 ${
              showArrows ? 'opacity-100' : 'opacity-0 sm:opacity-0'
            }`}
            onClick={prevImage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Right Arrow */}
          <Button
            size="sm"
            variant="ghost"
            className={`absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-lg transition-all duration-300 ${
              showArrows ? 'opacity-100' : 'opacity-0 sm:opacity-0'
            }`}
            onClick={nextImage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Photo Indicators (Dots) */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              className={`rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-3 h-3 bg-white shadow-lg' 
                  : 'w-2 h-2 bg-white/60 hover:bg-white/80'
              }`}
              onClick={(e) => goToImage(index, e)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
