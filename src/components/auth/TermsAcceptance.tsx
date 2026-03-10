import React from 'react';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';

interface TermsAcceptanceProps {
  accepted: boolean;
  onAcceptanceChange: (accepted: boolean) => void;
  className?: string;
}

const TermsAcceptance: React.FC<TermsAcceptanceProps> = ({ 
  accepted, 
  onAcceptanceChange, 
  className = '' 
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <Checkbox 
          id="terms" 
          checked={accepted}
          onCheckedChange={(checked) => onAcceptanceChange(checked === true)}
          className="mt-1"
        />
        <label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed">
          Li e aceito os{' '}
          <Link to="/terms" className="text-blue-600 hover:text-blue-700 underline font-semibold">
            Termos de Uso
          </Link>{' '}
          e{' '}
          <Link to="/privacy" className="text-blue-600 hover:text-blue-700 underline font-semibold">
            Política de Privacidade
          </Link>
          . Confirmo que as informações fornecidas são verdadeiras.
        </label>
      </div>
    </div>
  );
};

export default TermsAcceptance;



