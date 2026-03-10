// Componente StepWizard temporário para compatibilidade
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  component: () => React.ReactNode;
  isValid: boolean;
  isOptional?: boolean;
  hideActions?: boolean;
}

interface StepWizardProps {
  steps: WizardStep[];
  onComplete: () => Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
}

const StepWizard: React.FC<StepWizardProps> = ({ steps, onComplete, onCancel, isSubmitting }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];

  const canGoNext = step.isValid || step.isOptional;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="space-y-5">
      {/* Progress bar - Minimalista */}
      <div className="flex items-center justify-between gap-2">
        {steps.map((s, index) => {
          const Icon = s.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-9 h-9 rounded-full transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                  : isCompleted 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-slate-100 text-slate-400'
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1.5 transition-colors ${
                  index < currentStep ? 'bg-blue-600' : 'bg-slate-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step info - Simplificado */}
      <div className="text-center pb-2">
        <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
        <p className="text-xs text-slate-500">{step.description}</p>
      </div>

      {/* Step content */}
      <div>
        {step.component()}
      </div>

      {/* Navigation buttons */}
      {!step.hideActions && (
        <div className="flex justify-between pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 0 || isSubmitting}
            className="h-10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext || isSubmitting}
            className="h-10 bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Publicando...' : (isLastStep ? 'Publicar Evento' : 'Próximo')}
            {!isSubmitting && !isLastStep && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
};

export default StepWizard;

