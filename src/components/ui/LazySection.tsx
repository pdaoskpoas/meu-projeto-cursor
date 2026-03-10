import React from 'react';
import { useLazySection } from '@/hooks/useLazySection';
import { cn } from '@/lib/utils';

interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  minHeight?: string;
}

const LazySection: React.FC<LazySectionProps> = ({
  children,
  fallback,
  className = '',
  threshold = 0.25,
  rootMargin = '0px',
  minHeight = '200px'
}) => {
  const { elementRef, isVisible } = useLazySection({
    threshold,
    rootMargin,
    triggerOnce: true
  });

  const defaultFallback = (
    <div className={cn('animate-pulse', className)} style={{ minHeight }}>
      <div className="bg-slate-200 rounded-lg w-full h-full">
        <div className="p-8 space-y-4">
          <div className="h-6 bg-slate-300 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-300 rounded w-full"></div>
            <div className="h-4 bg-slate-300 rounded w-5/6"></div>
            <div className="h-4 bg-slate-300 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section ref={elementRef} className={cn('content-visibility-auto', className)}>
      {isVisible ? children : (fallback || defaultFallback)}
    </section>
  );
};

export default LazySection;




