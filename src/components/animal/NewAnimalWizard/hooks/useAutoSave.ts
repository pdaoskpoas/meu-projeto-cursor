// src/components/animal/NewAnimalWizard/hooks/useAutoSave.ts

import { useEffect } from 'react';
import type { AnimalFormData } from '@/types/animal';
import { log } from '@/utils/logger';

/**
 * Hook para auto-salvar formulário no sessionStorage
 * Implementa debounce de 500ms para evitar escrita excessiva
 */
export function useAutoSave(
  formData: AnimalFormData,
  onSaved?: () => void,
  disabled: boolean = false // ✅ Novo parâmetro para desabilitar auto-save
) {
  useEffect(() => {
    // ✅ Se disabled, não fazer nada
    if (disabled) {
      return;
    }

    // Debounce de 500ms
    const timer = setTimeout(() => {
      try {
        // Salvar no sessionStorage (sem File objects)
        const dataToSave = {
          basicInfo: formData.basicInfo,
          location: formData.location,
          photos: {
            // Não salvar File objects (não são serializáveis)
            files: [],
            previews: formData.photos.previews
          },
          genealogy: formData.genealogy,
          extras: formData.extras
        };

        sessionStorage.setItem('animalDraft', JSON.stringify(dataToSave));
        
        log('Auto-save: Draft salvo no sessionStorage');
        
        // Callback opcional
        onSaved?.();
        
      } catch (error) {
        console.error('Erro ao salvar draft:', error);
      }
    }, 500); // ✅ Debounce de 500ms

    return () => clearTimeout(timer);
  }, [formData, onSaved, disabled]);
}

