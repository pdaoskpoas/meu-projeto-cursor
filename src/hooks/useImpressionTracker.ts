import { useEffect, useRef } from 'react';
import { analyticsService } from '@/services/analyticsService';

interface UseImpressionTrackerOptions {
  /** Tipo do item: 'animal', 'article', 'event', etc. */
  type: string;
  /** ID único do item */
  id: string;
  /** Threshold para considerar visível (padrão: 0.5) */
  threshold?: number;
  /** Root margin para pre-load */
  rootMargin?: string;
}

/**
 * Hook genérico para rastrear impressões via IntersectionObserver.
 * Reutilize em qualquer componente que precisa de tracking de impressão.
 * Automaticamente desconecta o observer após a primeira impressão.
 * 
 * @returns ref para anexar ao elemento DOM
 */
export function useImpressionTracker<T extends HTMLElement = HTMLDivElement>({
  type,
  id,
  threshold = 0.5,
  rootMargin = '50px',
}: UseImpressionTrackerOptions) {
  const elementRef = useRef<T>(null);
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current || !elementRef.current) return;

    const element = elementRef.current;
    let observer: IntersectionObserver | null = null;

    try {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && !hasTracked.current) {
              analyticsService.recordImpression(type, id);
              hasTracked.current = true;
              observer?.disconnect();
              break;
            }
          }
        },
        { threshold, rootMargin }
      );

      observer.observe(element);
    } catch (err) {
      console.warn(`[useImpressionTracker] Error for ${type}:${id}`, err);
    }

    return () => {
      observer?.disconnect();
    };
  }, [type, id, threshold, rootMargin]);

  // Reset se o id mudar
  useEffect(() => {
    hasTracked.current = false;
  }, [id]);

  return elementRef;
}
