/* eslint-disable react-refresh/only-export-components */
// src/components/animal/NewAnimalWizard/WizardContext.tsx

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { WizardState, WizardAction, FormStep } from '@/types/wizard';
import type { AnimalFormData } from '@/types/animal';
import { log } from '@/utils/logger';

// ============================================
// ESTADO INICIAL
// ============================================

const initialFormData: AnimalFormData = {
  basicInfo: {
    name: '',
    breed: '',
    gender: 'Macho',
    birth_date: '',
    coat: '',
    category: 'Outro',
    is_registered: true
  },
  location: {
    current_city: '',
    current_state: ''
  },
  photos: {
    files: [],
    previews: []
  },
  genealogy: {
    // Pais
    father_name: null,
    mother_name: null,
    // Avós paternos
    paternal_grandfather_name: null,
    paternal_grandmother_name: null,
    // Avós maternos
    maternal_grandfather_name: null,
    maternal_grandmother_name: null,
    // Bisavós paternos (lado do avô paterno)
    paternal_gg_father_name: null,
    paternal_gg_mother_name: null,
    // Bisavós paternos (lado da avó paterna)
    paternal_gm_father_name: null,
    paternal_gm_mother_name: null,
    // Bisavós maternos (lado do avô materno)
    maternal_gg_father_name: null,
    maternal_gg_mother_name: null,
    // Bisavós maternos (lado da avó materna)
    maternal_gm_father_name: null,
    maternal_gm_mother_name: null
  },
  extras: {
    description: null,
    awards: []
  },
  publishConfig: {
    allow_messages: true,
    auto_renew: false
  },
  partnerships: []
};

const initialState: WizardState = {
  formData: initialFormData,
  currentStep: 1,
  completedSteps: [],
  stepValidations: {},
  isSubmitting: false,
  errors: {},
  lastSaved: null,
  uploadProgress: null,
  quota: null
};

// ============================================
// REDUCER
// ============================================

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  log('Reducer action:', action.type, action);

  switch (action.type) {
    // Atualizar dados dos steps
    case 'UPDATE_BASIC_INFO':
      return {
        ...state,
        formData: {
          ...state.formData,
          basicInfo: { ...state.formData.basicInfo, ...action.payload }
        },
        lastSaved: null // Marca como não salvo
      };

    case 'UPDATE_LOCATION':
      return {
        ...state,
        formData: {
          ...state.formData,
          location: { ...state.formData.location, ...action.payload }
        },
        lastSaved: null
      };

    case 'UPDATE_PHOTOS':
      return {
        ...state,
        formData: {
          ...state.formData,
          photos: { ...state.formData.photos, ...action.payload }
        },
        lastSaved: null
      };

    case 'UPDATE_GENEALOGY':
      return {
        ...state,
        formData: {
          ...state.formData,
          genealogy: { ...state.formData.genealogy, ...action.payload }
        },
        lastSaved: null
      };

    case 'UPDATE_EXTRAS':
      return {
        ...state,
        formData: {
          ...state.formData,
          extras: { ...state.formData.extras, ...action.payload }
        },
        lastSaved: null
      };

    case 'UPDATE_PUBLISH_CONFIG':
      return {
        ...state,
        formData: {
          ...state.formData,
          publishConfig: { ...state.formData.publishConfig, ...action.payload }
        },
        lastSaved: null
      };

    case 'UPDATE_PARTNERSHIPS':
      return {
        ...state,
        formData: {
          ...state.formData,
          partnerships: action.payload
        },
        lastSaved: null
      };

    // Navegação
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: Math.min(6, state.currentStep + 1) as FormStep,
        completedSteps: [...new Set([...state.completedSteps, state.currentStep])]
      };

    case 'PREV_STEP':
    case 'PREVIOUS_STEP':
      return {
        ...state,
        currentStep: Math.max(1, state.currentStep - 1) as FormStep
      };

    case 'GO_TO_STEP':
      return {
        ...state,
        currentStep: action.payload
      };

    // Validação
    case 'SET_VALIDATION':
      return {
        ...state,
        stepValidations: {
          ...state.stepValidations,
          [action.payload.step]: action.payload.isValid
        }
      };

    // Estados de UI
    case 'SET_QUOTA':
      return {
        ...state,
        quota: action.payload
      };

    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload
      };

    case 'SET_UPLOAD_PROGRESS':
      return {
        ...state,
        uploadProgress: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.field]: action.payload.message
        }
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: {}
      };

    case 'MARK_SAVED':
      return {
        ...state,
        lastSaved: new Date()
      };

    // Reset e load
    case 'RESET':
      return initialState;

    case 'LOAD_DRAFT':
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.payload
        }
      };

    default:
      return state;
  }
}

// ============================================
// CONTEXT
// ============================================

interface WizardContextValue {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

interface WizardProviderProps {
  children: React.ReactNode;
}

export const WizardProvider: React.FC<WizardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  // Carregar draft do sessionStorage ao montar
  useEffect(() => {
    const savedDraft = sessionStorage.getItem('animalDraft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        dispatch({ type: 'LOAD_DRAFT', payload: draft });
        log('Draft carregado do sessionStorage');
      } catch (error) {
        console.error('Erro ao carregar draft:', error);
        sessionStorage.removeItem('animalDraft');
      }
    }
  }, []);

  const value = {
    state,
    dispatch
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
};

// ============================================
// HOOK CUSTOMIZADO
// ============================================

export function useWizard() {
  const context = useContext(WizardContext);
  
  if (!context) {
    throw new Error('useWizard deve ser usado dentro de WizardProvider');
  }
  
  return context;
}

