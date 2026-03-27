import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Indicador visual de swipe para carrosséis.
 * Exibido apenas no mobile (hidden em sm+).
 * Mostra setas sutis + texto para ensinar o gesto.
 */
const CarouselSwipeIndicator: React.FC = () => (
  <div className="flex justify-center items-center gap-2 mt-4 sm:hidden" aria-hidden="true">
    <ChevronLeft className="h-3.5 w-3.5 text-slate-400" />
    <div className="flex items-center gap-1">
      <span className="w-6 h-1 rounded-full bg-blue-400/60" />
      <span className="w-3 h-1 rounded-full bg-slate-300/60" />
      <span className="w-3 h-1 rounded-full bg-slate-300/60" />
    </div>
    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
  </div>
);

export default CarouselSwipeIndicator;
