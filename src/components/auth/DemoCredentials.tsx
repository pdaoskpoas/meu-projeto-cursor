import React from 'react';

interface DemoCredentialsProps {
  className?: string;
}

const DemoCredentials: React.FC<DemoCredentialsProps> = ({ className = '' }) => {
  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">🔧</span>
        </div>
        <p className="text-sm font-bold text-blue-700">Credenciais de teste</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-1 rounded-lg">Email:</span>
          <span className="text-sm font-mono text-slate-700 bg-white/80 px-2 py-1 rounded-lg">usuario_teste@exemplo.com</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-1 rounded-lg">Senha:</span>
          <span className="text-sm font-mono text-slate-700 bg-white/80 px-2 py-1 rounded-lg">sua_senha_aqui</span>
        </div>
      </div>
    </div>
  );
};

export default DemoCredentials;
