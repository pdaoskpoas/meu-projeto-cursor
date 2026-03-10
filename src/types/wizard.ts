// src/types/wizard.ts

import type { AnimalFormData } from './animal';

/**
 * Steps do wizard (1 a 6)
 * 1: Informações Básicas
 * 2: Localização
 * 3: Fotos
 * 4: Genealogia
 * 5: Configurações Extras
 * 6: Revisar e Publicar
 */
export type FormStep = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Estado global do wizard
 */
export interface WizardState {
  // Dados do formulário
  formData: AnimalFormData;
  
  // Navegação
  currentStep: FormStep;
  completedSteps: number[]; // Steps já visitados
  stepValidations: Record<number, boolean>; // Status de validação por step
  
  // Estados de UI
  isSubmitting: boolean;
  errors: Record<string, string>; // Erros por campo
  lastSaved: Date | null; // Timestamp do último auto-save
  
  // Upload de fotos
  uploadProgress: {
    current: number; // Foto atual sendo enviada
    total: number; // Total de fotos
    retrying: boolean; // Se está em retry
    message?: string; // Mensagem customizada de progresso
  } | null;
  
  // Dados de quota do plano
  quota: {
    plan: string; // Nome do plano (free, basic, pro, etc.)
    remaining: number; // Vagas restantes
    allowedByPlan: number; // Total permitido pelo plano
  } | null;
}

/**
 * Ações do reducer para atualizar o estado
 */
export type WizardAction =
  // Atualizar dados de cada step
  | { type: 'UPDATE_BASIC_INFO'; payload: Partial<AnimalFormData['basicInfo']> }
  | { type: 'UPDATE_LOCATION'; payload: Partial<AnimalFormData['location']> }
  | { type: 'UPDATE_PHOTOS'; payload: Partial<AnimalFormData['photos']> }
  | { type: 'UPDATE_GENEALOGY'; payload: Partial<AnimalFormData['genealogy']> }
  | { type: 'UPDATE_EXTRAS'; payload: Partial<AnimalFormData['extras']> }
  | { type: 'UPDATE_PUBLISH_CONFIG'; payload: Partial<AnimalFormData['publishConfig']> }
  | { type: 'UPDATE_PARTNERSHIPS'; payload: AnimalFormData['partnerships'] }
  
  // Navegação
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'PREVIOUS_STEP' } // Alias para PREV_STEP
  | { type: 'GO_TO_STEP'; payload: FormStep }
  
  // Validação
  | { type: 'SET_VALIDATION'; payload: { step: number; isValid: boolean } }
  
  // Estados de UI
  | { type: 'SET_QUOTA'; payload: WizardState['quota'] }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_UPLOAD_PROGRESS'; payload: WizardState['uploadProgress'] }
  | { type: 'SET_ERROR'; payload: { field: string; message: string } }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'MARK_SAVED' }
  
  // Reset completo
  | { type: 'RESET' }
  | { type: 'LOAD_DRAFT'; payload: Partial<AnimalFormData> };


