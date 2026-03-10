import React, { useState } from 'react';
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

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
  };

  return (
    <div 
      className={`relative group ${className}`}
      onMouseEnter={() => setShowArrows(true)}
      onMouseLeave={() => setShowArrows(false)}
    >
      {/* Main Image */}
      <LazyImage
        src={images[currentIndex]}
        alt={alt}
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        fallbackSrc="/placeholder-horse.jpg"
      />

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          {/* Left Arrow */}
          <Button
            size="sm"
            variant="ghost"
            className={`absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-lg transition-all duration-300 ${
              showArrows ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={prevImage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Right Arrow */}
          <Button
            size="sm"
            variant="ghost"
            className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-lg transition-all duration-300 ${
              showArrows ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={nextImage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Photo Indicators (Dots) */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
          {images.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-white shadow-lg' 
                  : 'bg-white/60 hover:bg-white/80'
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
