import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative min-h-[calc(100vh-10rem)] flex items-center justify-center p-4 ${className}`}>
      {/* Fundo com gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        {/* Padrão decorativo de fundo */}
        <div className="absolute inset-0 opacity-[0.02]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="auth-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="1.5" fill="currentColor" className="text-blue-600" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#auth-pattern)" />
          </svg>
        </div>
      </div>

      {/* Container do formulário */}
      <div className="relative w-full max-w-md space-y-8">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3 group">
            <div className="w-20 h-20 flex items-center justify-center">
              <img 
                src="/logo.png.png" 
                alt="Logo Vitrine do Cavalo"
                className="w-20 h-20 object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  // Fallback se a imagem não carregar
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <div className="hidden w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              Vitrine do Cavalo
            </h1>
          </Link>
        </div>
        
        {children}
      </div>
    </div>
  );
};

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl border-2 border-slate-200/60 shadow-xl shadow-slate-200/50 p-8 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/60 hover:border-slate-300/60 ${className}`}>
      {children}
    </div>
  );
};

interface AuthFooterProps {
  className?: string;
}

export const AuthFooter: React.FC<AuthFooterProps> = ({ className = '' }) => {
  return (
    <div className={`text-center mt-8 ${className}`}>
      <p className="text-sm text-slate-500">
        © 2024 <span className="font-semibold text-slate-600">Vitrine do Cavalo</span>
      </p>
      <p className="text-xs text-slate-400 mt-1">
        Plataforma Premium de Gestão Equestre
      </p>
    </div>
  );
};

export default AuthLayout;
