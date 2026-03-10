import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`text-center space-y-4 ${className}`}>
      <div className="flex flex-col items-center justify-center space-y-4">
        <div 
          className="relative"
          role="img"
          aria-label="Logo da empresa"
        >
          <img 
            src="/logo.png.png" 
            alt="Logo da empresa"
            className="h-20 w-auto object-contain drop-shadow-lg"
            onError={(e) => {
              // Fallback para emoji se a imagem não carregar
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div 
            className="h-20 w-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-xl hidden"
            aria-hidden="true"
          >
            <span className="text-white font-bold text-2xl"></span>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Vitrine do Cavalo
          </h1>
          <p className="text-sm font-semibold text-blue-500 uppercase tracking-wider">
            Plataforma Premium
          </p>
        </div>
      </div>
    </div>
  );
};

export default Logo;
