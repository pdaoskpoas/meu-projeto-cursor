import React from 'react';
import { Check, X } from 'lucide-react';
import { calculatePasswordStrength, passwordRequirements } from '@/utils/passwordValidation';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

/**
 * 🔒 Componente de indicador visual de força de senha
 * Mostra barra de progresso e requisitos em tempo real
 */
export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  showRequirements = true 
}) => {
  const strength = calculatePasswordStrength(password);

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Barra de força */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Força da senha:</span>
          <span className={`font-semibold ${
            strength.score <= 1 ? 'text-gray-700' :
            strength.score === 2 ? 'text-gray-700' :
            strength.score === 3 ? 'text-blue-600' :
            'text-blue-600'
          }`}>
            {strength.label}
          </span>
        </div>
        
        {/* Barra de progresso */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${(strength.score / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Lista de requisitos */}
      {showRequirements && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-700">Requisitos:</p>
          {passwordRequirements.map((requirement, index) => {
            const isMet = requirement.test(password);
            return (
              <div 
                key={index}
                className="flex items-start gap-2 text-xs"
              >
                {isMet ? (
                  <Check className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                )}
                <span className={isMet ? 'text-blue-700' : 'text-gray-600'}>
                  {requirement.message}
                </span>
              </div>
            );
          })}

          {/* Feedback adicional */}
          {strength.feedback.length > 0 && strength.score < 3 && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              <p className="font-medium">Dicas:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {strength.feedback.slice(0, 3).map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;





