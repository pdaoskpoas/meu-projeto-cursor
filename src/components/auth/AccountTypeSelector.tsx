import React from 'react';
import { User, Building2, CheckCircle2 } from 'lucide-react';

interface AccountTypeSelectorProps {
  accountType: 'personal' | 'institutional';
  onAccountTypeChange: (type: 'personal' | 'institutional') => void;
  className?: string;
}

const AccountTypeSelector: React.FC<AccountTypeSelectorProps> = ({ 
  accountType, 
  onAccountTypeChange, 
  className = '' 
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-sm font-semibold text-slate-700">
        Tipo de Conta
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onAccountTypeChange('personal')}
          className={`relative p-4 rounded-xl border-2 text-left transition-all duration-300 group ${
            accountType === 'personal'
              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-50/50 shadow-lg shadow-blue-500/10'
              : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-md'
          }`}
        >
          {/* Indicador de seleção */}
          <div className={`absolute top-3 right-3 transition-all duration-300 ${
            accountType === 'personal' ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}>
            <CheckCircle2 className="h-5 w-5 text-blue-600 fill-blue-100" />
          </div>

          <div className="flex items-start space-x-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
              accountType === 'personal' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600'
            }`}>
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold mb-0.5 transition-colors ${
                accountType === 'personal' ? 'text-blue-900' : 'text-slate-900'
              }`}>
                Usuário Simples
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Perfil pessoal básico
              </p>
            </div>
          </div>
        </button>
        
        <button
          type="button"
          onClick={() => onAccountTypeChange('institutional')}
          className={`relative p-4 rounded-xl border-2 text-left transition-all duration-300 group ${
            accountType === 'institutional'
              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-50/50 shadow-lg shadow-blue-500/10'
              : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-md'
          }`}
        >
          {/* Indicador de seleção */}
          <div className={`absolute top-3 right-3 transition-all duration-300 ${
            accountType === 'institutional' ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}>
            <CheckCircle2 className="h-5 w-5 text-blue-600 fill-blue-100" />
          </div>

          <div className="flex items-start space-x-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
              accountType === 'institutional' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600'
            }`}>
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold mb-0.5 transition-colors ${
                accountType === 'institutional' ? 'text-blue-900' : 'text-slate-900'
              }`}>
                Haras / CTE / Fazenda
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Perfil institucional completo
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default AccountTypeSelector;



