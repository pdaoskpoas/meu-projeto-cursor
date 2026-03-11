// src/components/animal/NewAnimalWizard/index.tsx

import React, { lazy, Suspense, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WizardProvider, useWizard } from './WizardContext';
import { WizardProgress } from './shared/WizardProgress';
import { StepSkeleton } from './shared/StepSkeleton';
import { CancelDialog } from './shared/CancelDialog';
import { useAutoSave } from './hooks/useAutoSave';
import { useAuth } from '@/contexts/AuthContext';
import { prefetchUserPlanQuota, clearPlanCache } from '@/services/planService';
import { ensureActiveSession } from '@/services/sessionService';
import { StepBasicInfo } from './steps/StepBasicInfo';
import { StepLocation } from './steps/StepLocation';
import { StepPhotosV2 as StepPhotos } from './steps/StepPhotosV2';
import { StepExtras } from './steps/StepExtras';
import { StepReview } from './steps/StepReview';

// ✅ Lazy load do Step 4 (Genealogia) - step mais pesado
const StepGenealogy = lazy(() => 
  import('./steps/StepGenealogy').then(module => ({
    default: module.StepGenealogy
  }))
);

interface NewAnimalWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (animalId: string, shareCode: string) => void;
  actingUserId?: string;
  actingProfile?: { property_name?: string | null; account_type?: string } | null;
  isAdminMode?: boolean;
  adminUserId?: string;
}

/**
 * Componente interno que usa o WizardContext
 */
const WizardContent: React.FC<{
  onClose: () => void;
  isOpen: boolean;
  onSuccess?: (animalId: string, shareCode: string) => void;
  actingUserId?: string;
  actingProfile?: { property_name?: string | null; account_type?: string } | null;
  isAdminMode?: boolean;
  adminUserId?: string;
}> = ({ onClose, isOpen, onSuccess, actingUserId, actingProfile, isAdminMode, adminUserId }) => {
  const { state, dispatch } = useWizard();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Auto-save com debounce de 500ms
  // ✅ DESABILITAR durante submissão para evitar loop infinito
  useAutoSave(
    state.formData, 
    () => {
      dispatch({ type: 'MARK_SAVED' });
    },
    state.isSubmitting // Desabilita auto-save quando está submetendo
  );

  // ✅ Reset completo quando modal fecha
  useEffect(() => {
    if (!isOpen) {
      // Limpar previews blob para evitar leaks de memória
      state.formData.photos.previews.forEach((preview) => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
      // Garantir que tudo está limpo quando modal fecha
      dispatch({ type: 'RESET' });
      sessionStorage.removeItem('animalDraft');
      sessionStorage.removeItem('animalDraft_timestamp');
    }
  }, [isOpen, dispatch, state.formData.photos.previews]);

  // Verificar se há dados preenchidos antes de fechar
  const hasFormData = () => {
    const { basicInfo, location, photos } = state.formData;
    return (
      basicInfo.name.length > 0 ||
      basicInfo.breed.length > 0 ||
      basicInfo.coat.length > 0 ||
      location.current_city.length > 0 ||
      photos.files.length > 0
    );
  };

  const handleCloseAttempt = () => {
    // ✅ SEMPRE mostrar dialog de confirmação
    // Previne fechamento acidental
    setShowCancelDialog(true);
  };

  const handleConfirmClose = () => {
    setShowCancelDialog(false);
    dispatch({ type: 'RESET' });
    onClose();
  };

  const handleCancelClose = () => {
    setShowCancelDialog(false);
  };

  // Renderizar step atual
  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return <StepBasicInfo />;
      case 2:
        return <StepLocation />;
      case 3:
        return <StepPhotos />;
      case 4:
        return (
          <Suspense fallback={<StepSkeleton />}>
            <StepGenealogy />
          </Suspense>
        );
      case 5:
        return <StepExtras />;
      case 6:
        return (
          <StepReview
            onSuccess={onSuccess}
            onClose={onClose}
            actingUserId={actingUserId}
            actingProfile={actingProfile}
            isAdminMode={isAdminMode}
            adminUserId={adminUserId}
          />
        );
      default:
        return <StepBasicInfo />;
    }
  };

  return (
    <>
      <DialogContent 
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          e.preventDefault();
          handleCloseAttempt();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          handleCloseAttempt();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Adicionar Novo Animal
          </DialogTitle>
        </DialogHeader>

        {/* Barra de Progresso */}
        <WizardProgress
          currentStep={state.currentStep}
          completedSteps={state.completedSteps}
          stepValidations={state.stepValidations}
        />

        {/* Indicador de Auto-save */}
        {state.lastSaved && (
          <div className="text-xs text-gray-500 text-right -mt-2">
            ✓ Salvo automaticamente há{' '}
            {Math.floor((Date.now() - state.lastSaved.getTime()) / 1000)}s
          </div>
        )}

        {/* Step Atual */}
        <div className="mt-4">
          {renderCurrentStep()}
        </div>
      </DialogContent>

      {/* Dialog de Cancelamento */}
      <CancelDialog
        isOpen={showCancelDialog}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
      />
    </>
  );
};

/**
 * Componente principal do Wizard
 * Gerencia o modal e fornece o contexto
 */
export const NewAnimalWizard: React.FC<NewAnimalWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actingUserId,
  actingProfile,
  isAdminMode = false,
  adminUserId
}) => {
  const { user } = useAuth();
  const effectiveUserId = actingUserId || user?.id;

  // ✅ PRE-FETCH: Carregar plano em background quando modal abrir
  useEffect(() => {
    if (isOpen && effectiveUserId) {
      console.log('📂 [Wizard] Modal aberto - preparando sessão e plano...');
      clearPlanCache();

      const warmUpWizardSession = async (forceRefresh = false) => {
        try {
          await ensureActiveSession({ forceRefresh, timeoutMs: 8000 });
          await prefetchUserPlanQuota(effectiveUserId, { forceFresh: forceRefresh });
        } catch (error) {
          console.error('Erro ao manter sessão do wizard ativa:', error);
        }
      };

      void warmUpWizardSession();

      const sessionInterval = window.setInterval(() => {
        void warmUpWizardSession();
      }, 5 * 60 * 1000);

      const handleWindowFocus = () => {
        void warmUpWizardSession();
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          void warmUpWizardSession();
        }
      };

      window.addEventListener('focus', handleWindowFocus);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        window.clearInterval(sessionInterval);
        window.removeEventListener('focus', handleWindowFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isOpen, effectiveUserId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <WizardProvider>
        <WizardContent
          onClose={onClose}
          isOpen={isOpen}
          onSuccess={onSuccess}
          actingUserId={actingUserId}
          actingProfile={actingProfile}
          isAdminMode={isAdminMode}
          adminUserId={adminUserId}
        />
      </WizardProvider>
    </Dialog>
  );
};

