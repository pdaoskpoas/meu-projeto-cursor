/**
 * AnimalImpressionTracker Component
 * 
 * Componente wrapper para rastrear impressões de animais em carrosséis e listas.
 * Usa IntersectionObserver para detectar quando o elemento entra no viewport
 * e registra automaticamente a impressão no banco de dados.
 * 
 * @author Sistema de Analytics
 * @date 08/11/2025
 */

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { analyticsService } from '@/services/analyticsService';
import { useAuth } from '@/contexts/AuthContext';

interface AnimalImpressionTrackerProps {
  /** ID único do animal */
  animalId: string;
  
  /** Índice do animal no carrossel (opcional) */
  carouselIndex?: number;
  
  /** Nome do carrossel onde o animal está sendo exibido (opcional) */
  carouselName?: string;
  
  /** Callback executado quando o animal é clicado (opcional) */
  onAnimalClick?: () => void;
  
  /** Conteúdo a ser renderizado (o card do animal) */
  children: ReactNode;
  
  /** Threshold para considerar o elemento visível (padrão: 0.5 = 50%) */
  threshold?: number;
}

export const AnimalImpressionTracker = ({
  animalId,
  carouselIndex,
  carouselName,
  onAnimalClick,
  children,
  threshold = 0.5
}: AnimalImpressionTrackerProps) => {
  const { user } = useAuth();
  const elementRef = useRef<HTMLDivElement>(null);
  const hasTrackedImpression = useRef(false);

  /**
   * Configura IntersectionObserver para detectar quando o elemento
   * entra no viewport e registra a impressão
   */
  useEffect(() => {
    // Não criar observer se já foi rastreado
    if (hasTrackedImpression.current) {
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
              // Verificar se elemento está visível E ainda não foi rastreado
              if (entry.isIntersecting && !hasTrackedImpression.current) {
                // Registrar impressão
                analyticsService.recordImpression(
                  'animal',
                  animalId,
                  user?.id,
                  {
                    pageUrl: window.location.href,
                    carouselName: carouselName,
                    carouselPosition: carouselIndex,
                    viewportPosition: {
                      top: entry.boundingClientRect.top,
                      left: entry.boundingClientRect.left,
                      width: entry.boundingClientRect.width,
                      height: entry.boundingClientRect.height
                    }
                  }
                );

                // Marcar como rastreado
                hasTrackedImpression.current = true;

                // Desconectar observer para economizar recursos
                if (observer) {
                  observer.disconnect();
                }
              }
            } catch (err) {
              console.warn('Error tracking animal impression:', animalId, err);
            }
          });
        },
        {
          threshold: threshold,
          // Margem adicional para começar a observar um pouco antes
          rootMargin: '50px'
        }
      );

      // Iniciar observação
      observer.observe(element);
    } catch (err) {
      console.warn('Error creating impression observer for animal:', animalId, err);
    }

    // Cleanup: desconectar observer quando componente desmontar
    return () => {
      try {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
      } catch (err) {
        console.warn('Error disconnecting impression observer:', animalId, err);
      }
    };
  }, [animalId, carouselIndex, carouselName, user?.id, threshold]);

  /**
   * Handler para cliques no elemento
   * Registra o clique e executa callback se fornecido
   */
  const handleClick = () => {
    // Registrar clique
    analyticsService.recordClick(
      'animal',
      animalId,
      user?.id,
      {
        clickTarget: carouselName ? `carousel_${carouselName}` : 'animal_list',
        pageUrl: window.location.href
      }
    );

    // Executar callback se fornecido
    if (onAnimalClick) {
      onAnimalClick();
    }
  };

  return (
    <div 
      ref={elementRef} 
      onClick={handleClick}
      className="animal-impression-tracker"
    >
      {children}
    </div>
  );
};

export default AnimalImpressionTracker;
