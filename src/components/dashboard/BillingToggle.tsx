import React from 'react';

interface BillingToggleProps {
  billingPeriod: 'monthly' | 'annual';
  onToggle: (period: 'monthly' | 'annual') => void;
}

const BillingToggle: React.FC<BillingToggleProps> = ({ billingPeriod, onToggle }) => {
  return (
    <div className="flex items-center justify-center space-x-4">
      <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>
        Mensal
      </span>
      <button
        onClick={() => onToggle(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          billingPeriod === 'annual' ? 'bg-orange-500' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            billingPeriod === 'annual' ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`text-sm font-medium ${billingPeriod === 'annual' ? 'text-slate-900' : 'text-slate-500'}`}>
        Anual
      </span>
      {billingPeriod === 'annual' && (
        <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
          Até 65% OFF
        </span>
      )}
    </div>
  );
};

export default BillingToggle;




