import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ImportantNoticeProps {
  className?: string;
}

const ImportantNotice: React.FC<ImportantNoticeProps> = ({ className = '' }) => {
  return (
    <div className={`bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertCircle className="h-4 w-4 text-white" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-amber-700">Informação importante</p>
          <p className="text-xs text-slate-600 leading-relaxed">
            O CPF e e-mail não poderão ser alterados após o cadastro. 
            Certifique-se de que as informações estão corretas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImportantNotice;



