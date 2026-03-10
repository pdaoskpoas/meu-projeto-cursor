import { useState, useEffect, useRef } from 'react';

interface UseLazySectionOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useLazySection = (options: UseLazySectionOptions = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '100px',
    triggerOnce = true
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Não criar observer se já foi trigado uma vez
    if (triggerOnce && hasTriggered) {
      return;
    }

    const element = elementRef.current;
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
                setIsVisible(true);
                if (triggerOnce) {
                  setHasTriggered(true);
                  if (observer && entry.target) {
                    observer.unobserve(entry.target);
                  }
                }
              } else if (!triggerOnce) {
                setIsVisible(false);
              }
            } catch (err) {
              console.warn('Error in LazySection observer callback:', err);
            }
          });
        },
        {
          threshold,
          rootMargin
        }
      );

      observer.observe(element);
    } catch (err) {
      console.warn('Error creating LazySection observer:', err);
      // Fallback: mostrar conteúdo imediatamente se observer falhar
      setIsVisible(true);
      if (triggerOnce) {
        setHasTriggered(true);
      }
    }

    return () => {
      try {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
      } catch (err) {
        console.warn('Error disconnecting LazySection observer:', err);
      }
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return {
    elementRef,
    isVisible: triggerOnce ? hasTriggered || isVisible : isVisible,
    hasTriggered
  };
};

export default useLazySection;




