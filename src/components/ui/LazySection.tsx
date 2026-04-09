import React from 'react';
import { useLazySection } from '@/hooks/useLazySection';
import { cn } from '@/lib/utils';

interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  id?: string;
  threshold?: number;
  rootMargin?: string;
  minHeight?: string;
}

const CarouselSkeleton: React.FC<{ minHeight: string }> = ({ minHeight }) => (
  <div className="animate-pulse py-8 sm:py-10 lg:py-12" style={{ minHeight }}>
    <div className="container-responsive">
      {/* Título da seção */}
      <div className="mb-6">
        <div className="h-7 bg-slate-200 rounded-lg w-48 mb-2" />
        <div className="h-4 bg-slate-100 rounded w-64" />
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="aspect-[4/3] bg-slate-200" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="flex gap-2">
                <div className="h-6 bg-slate-100 rounded-full w-16" />
                <div className="h-6 bg-slate-100 rounded-full w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const LazySection: React.FC<LazySectionProps> = ({
  children,
  fallback,
  className = '',
  id,
  threshold = 0.1,
  rootMargin = '200px',
  minHeight = '200px'
}) => {
  const { elementRef, isVisible } = useLazySection({
    threshold,
    rootMargin,
    triggerOnce: true
  });

  return (
    <section ref={elementRef} id={id} className={cn('content-visibility-auto', className)}>
      {isVisible ? children : (fallback !== undefined ? fallback : <CarouselSkeleton minHeight={minHeight} />)}
    </section>
  );
};

export default LazySection;




