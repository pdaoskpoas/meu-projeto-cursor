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

  return (
    <div className="w-full py-6">
      {/* Barra de progresso */}
      <div className="relative">
        <div className="absolute top-5 left-0 w-full h-1 bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{
              width: `${((currentStep - 1) / 5) * 100}%`
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {[1, 2, 3, 4, 5, 6].map((step) => {
            const status = getStepStatus(step);
            const isValid = stepValidations[step];

            return (
              <div
                key={step}
                className="flex flex-col items-center"
              >
                {/* Ícone do step */}
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

                {/* Label */}
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



