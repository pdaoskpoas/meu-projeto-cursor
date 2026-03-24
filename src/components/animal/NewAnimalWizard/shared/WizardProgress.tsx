// src/components/animal/NewAnimalWizard/shared/WizardProgress.tsx

import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormStep } from '@/types/wizard';

interface WizardProgressProps {
  currentStep: FormStep;
  completedSteps: number[];
  stepValidations: Record<number, boolean>;
}

const STEP_LABELS = [
  'Informações Básicas',
  'Localização',
  'Fotos',
  'Genealogia',
  'Extras',
  'Revisar'
];

const STEP_SHORT_LABELS = [
  'Info',
  'Local',
  'Fotos',
  'Geneal.',
  'Extras',
  'Revisar'
];

export const WizardProgress: React.FC<WizardProgressProps> = ({
  currentStep,
  completedSteps,
  stepValidations
}) => {
  const getStepStatus = (step: number) => {
    if (completedSteps.includes(step) && stepValidations[step]) {
      return 'completed';
    }
    if (step === currentStep) {
      return 'current';
    }
    return 'pending';
  };

  const progressPercent = ((currentStep - 1) / 5) * 100;

  return (
    <div className="w-full py-4 sm:py-6">
      {/* Mobile: indicador compacto de texto + barra linear */}
      <div className="sm:hidden space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-semibold text-blue-600">
            Passo {currentStep} de 6
          </span>
          <span className="text-sm text-gray-500">
            {STEP_LABELS[currentStep - 1]}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* Mini dots para contexto visual */}
        <div className="flex justify-between px-1">
          {[1, 2, 3, 4, 5, 6].map((step) => {
            const status = getStepStatus(step);
            const isValid = stepValidations[step];
            return (
              <div
                key={step}
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  {
                    'bg-blue-600 text-white': status === 'current',
                    'bg-green-500 text-white': status === 'completed' && isValid,
                    'bg-gray-200 text-gray-400': status === 'pending'
                  }
                )}
              >
                {status === 'completed' && isValid ? '✓' : step}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tablet: stepper com labels curtas */}
      <div className="hidden sm:block lg:hidden relative">
        <div className="absolute top-4 left-0 w-full h-1 bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="relative flex justify-between">
          {[1, 2, 3, 4, 5, 6].map((step) => {
            const status = getStepStatus(step);
            const isValid = stepValidations[step];

            return (
              <div
                key={step}
                className="flex flex-col items-center"
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    'border-2 transition-all duration-200 text-sm font-bold',
                    {
                      'bg-blue-600 border-blue-600 text-white': status === 'current',
                      'bg-green-600 border-green-600 text-white': status === 'completed' && isValid,
                      'bg-gray-100 border-gray-300 text-gray-400': status === 'pending'
                    }
                  )}
                >
                  {status === 'completed' && isValid ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    step
                  )}
                </div>

                <span
                  className={cn(
                    'mt-1.5 text-[10px] font-medium text-center leading-tight',
                    {
                      'text-blue-600': status === 'current',
                      'text-green-600': status === 'completed' && isValid,
                      'text-gray-500': status === 'pending'
                    }
                  )}
                >
                  {STEP_SHORT_LABELS[step - 1]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop: stepper completo */}
      <div className="hidden lg:block relative">
        <div className="absolute top-5 left-0 w-full h-1 bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="relative flex justify-between">
          {[1, 2, 3, 4, 5, 6].map((step) => {
            const status = getStepStatus(step);
            const isValid = stepValidations[step];

            return (
              <div
                key={step}
                className="flex flex-col items-center"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    'border-2 transition-all duration-200',
                    {
                      'bg-blue-600 border-blue-600 text-white': status === 'current',
                      'bg-green-600 border-green-600 text-white': status === 'completed' && isValid,
                      'bg-gray-100 border-gray-300 text-gray-400': status === 'pending'
                    }
                  )}
                >
                  {status === 'completed' && isValid ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </div>

                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center max-w-[80px]',
                    {
                      'text-blue-600': status === 'current',
                      'text-green-600': status === 'completed' && isValid,
                      'text-gray-500': status === 'pending'
                    }
                  )}
                >
                  {STEP_LABELS[step - 1]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
