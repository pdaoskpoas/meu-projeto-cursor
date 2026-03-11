
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, MapPin, Star, CheckCircle2 } from 'lucide-react';
import { POPULAR_BREEDS } from '@/constants/breeds';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  const handleBreedClick = (breedName: string): void => {
    navigate(`/buscar?breed=${encodeURIComponent(breedName)}`);
  };

  return (
    <section 
      className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50/50 overflow-hidden"
      aria-label="Seção principal"
    >
      {/* Background Elements — sem animações pesadas em mobile */}
      <div className="absolute inset-0 overflow-hidden hidden sm:block">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-20 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }}></div>
      </div>
      {/* Mobile: bg simples sem animação */}
      <div className="absolute inset-0 sm:hidden bg-gradient-to-b from-blue-50 to-white" />

      <div className="relative container-responsive py-8 sm:py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-16 items-center">
          {/* Content */}
          <div className="space-y-6 sm:space-y-8 lg:pr-8">
            {/* Title */}
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                A maior vitrine{' '}
                <span className="text-blue-600 relative inline-block">
                  equestre do Brasil
                  <svg 
                    className="absolute -bottom-2 left-0 w-full h-3 text-blue-600/30" 
                    viewBox="0 0 200 12" 
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path 
                      d="M0,6 Q50,0 100,6 T200,6" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                  </svg>
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl">
                Conecte-se ao público certo e mostre o potencial dos seus animais para todo o país. Aumente sua visibilidade, fortaleça sua marca e conquiste novas oportunidades de negócio.
              </p>
            </div>

            {/* Key Benefits */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <span>Alcance nacional</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <span>Perfis profissionais</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <span>Painel intuitivo</span>
              </div>
            </div>

            {/* Popular Breeds */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-600 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-blue-600" aria-hidden="true" />
                Raças mais procuradas:
              </p>
              <div className="flex flex-wrap gap-2" role="list" aria-label="Raças populares">
                {POPULAR_BREEDS.map((breed) => (
                  <button
                    key={breed}
                    onClick={() => handleBreedClick(breed)}
                    className="inline-flex items-center bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-400 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:text-blue-600 transition-all duration-200 shadow-sm hover:shadow-md min-h-[44px]"
                    role="listitem"
                    aria-label={`Buscar raça ${breed}`}
                  >
                    {breed}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative hidden lg:block" aria-hidden="true">
            <div className="relative">
              {/* Main Visual Card */}
              <div className="w-full h-[450px] bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl shadow-2xl overflow-hidden relative">
                {/* Pattern Overlay */}
                <div className="absolute inset-0 opacity-10">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                {/* Content */}
                <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 p-6 animate-pulse" style={{ animationDuration: '3s' }}>
                    <img 
                      src="/logo.png.png" 
                      alt="Logo Vitrine do Cavalo"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Fallback se a imagem não carregar
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'block';
                      }}
                    />
                    <Star className="w-16 h-16 text-white fill-white hidden" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-3">Vitrine do Cavalo</h3>
                  <p className="text-blue-100 text-lg mb-8">Plataforma Premium de Gestão Equestre</p>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-3xl font-bold text-white">150+</p>
                      <p className="text-blue-100 text-sm mt-1">Haras</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-3xl font-bold text-white">8,5k+</p>
                      <p className="text-blue-100 text-sm mt-1">Animais</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stats Cards */}
              <div className="absolute -top-6 -right-6 bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Todo Brasil</p>
                    <p className="text-xl font-bold text-slate-900">27 Estados</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 animate-bounce" style={{ animationDuration: '3s', animationDelay: '1s' }}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Crescimento</p>
                    <p className="text-xl font-bold text-blue-600">+45%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
