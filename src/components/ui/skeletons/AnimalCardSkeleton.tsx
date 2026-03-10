import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton loader para cards de animais
 * Usado durante carregamento de listas e carrosséis
 */
export const AnimalCardSkeleton: React.FC = () => {
  return (
    <Card className="overflow-hidden">
      {/* Imagem */}
      <Skeleton className="h-48 w-full" />
      
      <div className="p-4 space-y-3">
        {/* Nome */}
        <Skeleton className="h-5 w-3/4" />
        
        {/* Raça e badges */}
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        
        {/* Localização */}
        <Skeleton className="h-4 w-2/3" />
        
        {/* Haras */}
        <Skeleton className="h-4 w-1/2" />
        
        {/* Botões */}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </Card>
  );
};

/**
 * Grid de skeletons para múltiplos cards
 */
export const AnimalCardSkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <AnimalCardSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Skeleton para carrossel de animais (horizontal)
 */
export const AnimalCarouselSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-80">
          <AnimalCardSkeleton />
        </div>
      ))}
    </div>
  );
};

export default AnimalCardSkeleton;


