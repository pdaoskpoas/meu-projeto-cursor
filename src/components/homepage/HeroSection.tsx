
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, MapPin, Search, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { POPULAR_BREEDS } from '@/constants/breeds';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  const handleBreedClick = (breedName: string): void => {
    navigate(`/buscar?breed=${encodeURIComponent(breedName)}`);
  };

  return (
    <section
      className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 overflow-hidden"
      aria-label="Seção principal"
    >
      {/* Background decorativo sutil */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative container-responsive py-10 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Conteúdo principal */}
          <div className="space-y-6 sm:space-y-8">
            {/* Título focado no benefício do usuário */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-[1.15]">
                Encontre o cavalo{' '}
                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  ideal para você
                </span>
              </h1>
              <p className="text-base sm:text-lg text-blue-100/80 leading-relaxed max-w-lg">
                Milhares de animais de raça reunidos em um só lugar. Busque por raça, região ou criador.
              </p>
            </div>

            {/* Prova social — visível em TODOS os dispositivos */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/10 text-center">
                <p className="text-xl sm:text-2xl font-bold text-white">8,5k+</p>
                <p className="text-xs sm:text-sm text-blue-200/70 mt-0.5">Animais</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/10 text-center">
                <p className="text-xl sm:text-2xl font-bold text-white">150+</p>
                <p className="text-xs sm:text-sm text-blue-200/70 mt-0.5">Haras</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/10 text-center">
                <p className="text-xl sm:text-2xl font-bold text-white">27</p>
                <p className="text-xs sm:text-sm text-blue-200/70 mt-0.5">Estados</p>
              </div>
            </div>

            {/* CTA principal com hierarquia clara */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="bg-white hover:bg-blue-50 text-slate-900 font-bold shadow-lg shadow-white/10 hover:shadow-xl hover:shadow-white/20 transition-all duration-300 text-base"
                onClick={() => navigate('/buscar')}
              >
                <Search className="h-5 w-5 mr-2" />
                Buscar animais
              </Button>
              <Button
                size="lg"
                className="bg-transparent border-2 border-blue-400/50 text-blue-200 hover:bg-blue-500/20 hover:border-blue-400 hover:text-white transition-all duration-300 text-base font-semibold"
                onClick={() => navigate('/register')}
              >
                Cadastre seu animal
              </Button>
            </div>

            {/* Raças populares */}
            <div className="space-y-3">
              <p className="text-xs sm:text-sm font-medium text-blue-200/60 flex items-center">
                <TrendingUp className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                Raças em alta:
              </p>
              <div className="flex flex-wrap gap-2" role="list" aria-label="Raças populares">
                {POPULAR_BREEDS.map((breed) => (
                  <button
                    key={breed}
                    onClick={() => handleBreedClick(breed)}
                    className="inline-flex items-center bg-white/8 hover:bg-white/15 border border-white/10 hover:border-white/25 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium text-blue-100 hover:text-white transition-all duration-200 min-h-[44px]"
                    role="listitem"
                    aria-label={`Buscar raça ${breed}`}
                  >
                    {breed}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card visual — desktop */}
          <div className="relative hidden lg:block" aria-hidden="true">
            <div className="relative">
              <div className="w-full h-[420px] bg-gradient-to-br from-blue-600/20 to-blue-800/30 rounded-3xl border border-white/10 overflow-hidden relative backdrop-blur-sm">
                {/* Pattern Overlay */}
                <div className="absolute inset-0 opacity-5">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 p-5 border border-white/10">
                    <img
                      src="/logo.png.png"
                      alt="Logo Vitrine do Cavalo"
                      loading="eager"
                      decoding="async"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'block';
                      }}
                    />
                    <Sparkles className="w-12 h-12 text-white hidden" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Vitrine do Cavalo</h3>
                  <p className="text-blue-200/60 text-sm mb-8">Plataforma Premium de Gestão Equestre</p>

                  <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-center gap-2 text-blue-300 mb-1">
                        <Users className="h-4 w-4" />
                      </div>
                      <p className="text-2xl font-bold text-white">150+</p>
                      <p className="text-blue-200/50 text-xs mt-1">Criadores ativos</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-center gap-2 text-blue-300 mb-1">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <p className="text-2xl font-bold text-white">27</p>
                      <p className="text-blue-200/50 text-xs mt-1">Estados cobertos</p>
                    </div>
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
