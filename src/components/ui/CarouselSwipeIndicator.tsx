import React from 'react';

/**
 * Indicador visual sutil de swipe para carrosséis.
 * Exibido apenas no mobile (hidden em sm+).
 * Puramente decorativo — sinaliza que há conteúdo horizontal.
 */
const CarouselSwipeIndicator: React.FC = () => (
  <div className="flex justify-center items-center gap-1.5 mt-3 sm:hidden" aria-hidden="true">
    <span className="w-5 h-1 rounded-full bg-slate-300 opacity-60" />
    <span className="w-5 h-1 rounded-full bg-slate-400 opacity-60" />
    <span className="w-5 h-1 rounded-full bg-slate-300 opacity-60" />
  </div>
);

export default CarouselSwipeIndicator;
