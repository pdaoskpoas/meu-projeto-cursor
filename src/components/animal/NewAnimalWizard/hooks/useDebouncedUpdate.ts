// src/components/animal/NewAnimalWizard/hooks/useDebouncedUpdate.ts

import { useCallback, useRef } from 'react';

/**
 * Hook para debounce de atualizações
 * Reduz re-renders em campos de texto
 */
export function useDebouncedUpdate<T extends (...args: never[]) => void>(
  callback: T,
  delay: number = 200
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}



