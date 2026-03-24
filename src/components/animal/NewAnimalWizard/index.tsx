// src/components/animal/NewAnimalWizard/index.tsx

import React, { lazy, Suspense, useCallback, useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WizardProvider, useWizard } from './WizardContext';
import { WizardProgress } from './shared/WizardProgress';
import { StepSkeleton } from './shared/StepSkeleton';
import { CancelDialog } from './shared/CancelDialog';
import { useAutoSave } from './hooks/useAutoSave';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanQuota } from '@/hooks/usePlanQuota';
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
  planBlocked: boolean;
  planLoading: boolean;
  isQuotaExceeded: boolean;
  onNavigateToPlans: () => void;
  closeAttemptRef: React.MutableRefObject<(() => void) | undefined>;
}> = ({ onClose, isOpen, onSuccess, actingUserId, actingProfile, isAdminMode, adminUserId, planBlocked, planLoading, isQuotaExceeded, onNavigateToPlans, closeAttemptRef }) => {
  const { state, dispatch } = useWizard();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const handleAutoSaved = useCallback(() => {
    dispatch({ type: 'MARK_SAVED' });
  }, [dispatch]);

  // Auto-save com debounce de 500ms
  // ✅ DESABILITAR durante submissão para evitar loop infinito
  useAutoSave(
    state.formData, 
    handleAutoSaved,
    state.isSubmitting || !isOpen // Desabilita auto-save quando está submetendo ou fechado
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
    setShowCancelDialog(true);
  };

  // Registrar handler de fechamento para o botão X do Dialog
  closeAttemptRef.current = planBlocked ? onClose : handleCloseAttempt;

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
        className="max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] md:max-w-3xl lg:max-w-5xl w-full max-h-[95dvh] overflow-y-auto p-4 sm:p-6 lg:p-8"
        onInteractOutside={(e) => {
          e.preventDefault();
          if (planBlocked) {
            onClose();
          } else {
            handleCloseAttempt();
          }
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          if (planBlocked) {
            onClose();
          } else {
            handleCloseAttempt();
          }
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

        {/* Step Atual - com overlay de bloqueio quando sem plano */}
        <div className="mt-4 relative">
          {/* Conteúdo do formulário (visível mas bloqueado quando sem plano) */}
          <div className={planBlocked ? 'blur-[2px] pointer-events-none select-none opacity-60' : ''}>
            {renderCurrentStep()}
          </div>

          {/* Overlay de bloqueio - exibido quando usuário não tem plano ativo */}
          {planBlocked && !planLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-white/95 backdrop-blur-sm border-2 border-blue-200 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md mx-4 text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  {isQuotaExceeded ? (
                    <Crown className="h-8 w-8 text-blue-600" />
                  ) : (
                    <Lock className="h-8 w-8 text-blue-600" />
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {isQuotaExceeded
                    ? 'Limite de animais atingido'
                    : 'Plano necessário para cadastrar'}
                </h3>

                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                  {isQuotaExceeded
                    ? 'Você atingiu o limite de animais do seu plano atual. Faça upgrade para cadastrar mais animais.'
                    : 'Para cadastrar e publicar seus animais, é necessário ter um plano ativo. Escolha o plano ideal para você e comece agora!'}
                </p>

                <div className="space-y-3">
                  <Button
                    onClick={onNavigateToPlans}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base gap-2"
                  >
                    {isQuotaExceeded ? 'Fazer Upgrade' : 'Ver Planos'}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Badge variant="secondary" className="text-xs font-normal">
                      A partir de R$ 33,25/mês
                    </Badge>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="w-full text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Voltar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Dialog de Cancelamento */}
      {!planBlocked && (
        <CancelDialog
          isOpen={showCancelDialog}
          onConfirm={handleConfirmClose}
          onCancel={handleCancelClose}
        />
      )}
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
  const navigate = useNavigate();
  const effectiveUserId = actingUserId || user?.id;

  // Verificar plano assim que o modal abrir
  const { quota, loading: planLoading } = usePlanQuota({
    userId: effectiveUserId,
    enabled: isOpen && !!effectiveUserId
  });

  // Determinar se o wizard deve ficar bloqueado
  const planBlocked = !planLoading && !!quota && (
    quota.plan === 'free' || !quota.planIsValid || quota.remaining <= 0
  );
  const isQuotaExceeded = !planLoading && !!quota && quota.planIsValid && quota.remaining <= 0;

  const handleNavigateToPlans = () => {
    onClose();
    navigate('/planos');
  };

  // PRE-FETCH: Carregar plano em background quando modal abrir
  // Deve ficar ANTES do early return para respeitar a regra de hooks do React
  useEffect(() => {
    if (isOpen && effectiveUserId) {
      clearPlanCache();

      const warmUpWizardSession = async () => {
        try {
          await ensureActiveSession({ timeoutMs: 10000 });
          await prefetchUserPlanQuota(effectiveUserId);
        } catch (error) {
          // Erro não crítico — sessão será tentada novamente
        }
      };

      void warmUpWizardSession();

      const sessionInterval = window.setInterval(() => {
        void warmUpWizardSession();
      }, 3 * 60 * 1000);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          void warmUpWizardSession();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        window.clearInterval(sessionInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isOpen, effectiveUserId]);

  if (!isOpen) {
    return null;
  }

  const closeAttemptRef = useRef<(() => void) | undefined>();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        if (closeAttemptRef.current) {
          closeAttemptRef.current();
        } else {
          onClose();
        }
      }
    }}>
      <WizardProvider>
        <WizardContent
          onClose={onClose}
          isOpen={isOpen}
          onSuccess={onSuccess}
          actingUserId={actingUserId}
          actingProfile={actingProfile}
          isAdminMode={isAdminMode}
          adminUserId={adminUserId}
          planBlocked={planBlocked}
          planLoading={planLoading}
          isQuotaExceeded={isQuotaExceeded}
          onNavigateToPlans={handleNavigateToPlans}
          closeAttemptRef={closeAttemptRef}
        />
      </WizardProvider>
    </Dialog>
  );
};

