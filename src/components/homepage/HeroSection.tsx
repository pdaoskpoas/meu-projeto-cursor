
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Search, ChevronDown, Eye, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { POPULAR_BREEDS } from '@/constants/breeds';
import { useTopAnimalsByGender } from '@/hooks/useTopAnimalsByGender';
import { mapAnimalRecordToCard } from '@/utils/animalCard';
import LazyImage from '@/components/ui/LazyImage';
import { supabase } from '@/lib/supabase';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  const { animals: topMales } = useTopAnimalsByGender('Macho', 1, 'month');
  const { animals: topFemales } = useTopAnimalsByGender('Fêmea', 1, 'month');

  const topMale = topMales[0] ? mapAnimalRecordToCard(topMales[0] as unknown as Record<string, unknown>) : null;
  const topFemale = topFemales[0] ? mapAnimalRecordToCard(topFemales[0] as unknown as Record<string, unknown>) : null;

  // Acessos totais ao site no mês atual
  const [siteVisitsThisMonth, setSiteVisitsThisMonth] = useState(0);

  useEffect(() => {
    const firstDay = new Date();
    firstDay.setDate(1);
    firstDay.setHours(0, 0, 0, 0);

    supabase
      .from('page_visits')
      .select('*', { count: 'exact', head: true })
      .eq('page_key', 'site_access')
      .gte('created_at', firstDay.toISOString())
      .then(({ count }) => {
        if (count && count > 0) setSiteVisitsThisMonth(count);
      });
  }, []);

  const handleBreedClick = (breedName: string): void => {
    navigate(`/buscar?breed=${encodeURIComponent(breedName)}`);
  };

  const formatCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

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

      <div className="relative container-responsive py-8 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Conteúdo principal */}
          <div className="space-y-5 sm:space-y-8">

            {/* Título */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-[1.1]">
                A maior vitrine{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  equestre do Brasil
                </span>
              </h1>
              <p className="text-sm sm:text-lg text-blue-100/70 leading-relaxed max-w-lg">
                Onde criadores posicionam seus melhores animais e compradores encontram genética de qualidade.
              </p>
            </div>

            {/* Prova social */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 sm:px-4 sm:py-4 border border-white/10 text-center">
                <p className="text-lg sm:text-2xl font-bold text-white">8,5k+</p>
                <p className="text-[10px] sm:text-sm text-blue-200/60">Animais</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 sm:px-4 sm:py-4 border border-white/10 text-center">
                <p className="text-lg sm:text-2xl font-bold text-white">150+</p>
                <p className="text-[10px] sm:text-sm text-blue-200/60">Haras</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 sm:px-4 sm:py-4 border border-white/10 text-center">
                <p className="text-lg sm:text-2xl font-bold text-white">27</p>
                <p className="text-[10px] sm:text-sm text-blue-200/60">Estados</p>
              </div>
            </div>

            {/* CTA principal + secundário */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white hover:bg-blue-50 text-slate-900 font-bold shadow-lg shadow-white/10 hover:shadow-xl transition-all duration-300 text-base"
                  onClick={() => navigate('/buscar')}
                >
                  <Search className="h-5 w-5 mr-2" />
                  Explorar animais
                </Button>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-blue-500 hover:bg-blue-400 text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all duration-300 text-base border-0"
                  onClick={() => navigate('/planos')}
                >
                  Anuncie seu plantel
                </Button>
              </div>

              <button
                onClick={() => navigate('/planos')}
                className="text-xs text-blue-300/60 hover:text-blue-200 transition-colors text-left"
              >
                Divulgue seu plantel — a partir de <span className="text-blue-200 font-semibold">R$ 33,25/mês</span>
              </button>

              {POPULAR_BREEDS.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-blue-300/50 uppercase tracking-wider font-medium">Populares:</span>
                  {POPULAR_BREEDS.map((breed) => (
                    <button
                      key={breed}
                      onClick={() => handleBreedClick(breed)}
                      className="text-sm text-blue-300/70 hover:text-white transition-colors font-medium bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full border border-white/10"
                    >
                      {breed}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Scroll hint — mobile */}
            <div className="flex justify-center pt-2 sm:hidden animate-bounce" style={{ animationDuration: '2s' }}>
              <ChevronDown className="h-5 w-5 text-blue-300/40" />
            </div>
          </div>

          {/* Showcase — top garanhão e top doadora do mês (desktop) */}
          <div className="relative hidden lg:block" aria-hidden="true">
            <div className="relative w-full h-[420px]">

              {/* Card top garanhão */}
              <Link
                to={topMale ? `/animal/${topMale.id}` : '/ranking'}
                className="absolute top-4 left-8 w-[260px] bg-white rounded-2xl shadow-2xl overflow-hidden transform -rotate-3 hover:rotate-0 transition-transform duration-500 block"
              >
                <div className="h-[180px] bg-slate-200 overflow-hidden relative">
                  {topMale && topMale.images.length > 0 ? (
                    <LazyImage
                      src={topMale.images[0]}
                      alt={topMale.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <span className="text-4xl">♂</span>
                    </div>
                  )}
                  {topMale && topMale.impressionCount > 0 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <Eye className="h-2.5 w-2.5" />
                      {formatCount(topMale.impressionCount)}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-wider text-blue-600 font-semibold mb-0.5">Top Garanhão do mês</p>
                  <p className="font-bold text-slate-900 text-sm truncate">{topMale?.name || 'Carregando...'}</p>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {topMale ? `${topMale.breed} · ${topMale.harasName}` : '—'}
                  </p>
                  {topMale && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                      <MapPin className="h-3 w-3" />
                      <span>{topMale.currentLocation.city}, {topMale.currentLocation.state}</span>
                    </div>
                  )}
                </div>
              </Link>

              {/* Card top doadora */}
              <Link
                to={topFemale ? `/animal/${topFemale.id}` : '/ranking'}
                className="absolute top-12 right-4 w-[260px] bg-white rounded-2xl shadow-2xl overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500 block"
              >
                <div className="h-[180px] bg-slate-200 overflow-hidden relative">
                  {topFemale && topFemale.images.length > 0 ? (
                    <LazyImage
                      src={topFemale.images[0]}
                      alt={topFemale.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center">
                      <span className="text-4xl">♀</span>
                    </div>
                  )}
                  {topFemale && topFemale.impressionCount > 0 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <Eye className="h-2.5 w-2.5" />
                      {formatCount(topFemale.impressionCount)}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-wider text-pink-600 font-semibold mb-0.5">Top Doadora do mês</p>
                  <p className="font-bold text-slate-900 text-sm truncate">{topFemale?.name || 'Carregando...'}</p>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {topFemale ? `${topFemale.breed} · ${topFemale.harasName}` : '—'}
                  </p>
                </div>
              </Link>

              {/* Badge de acessos ao site no mês */}
              {siteVisitsThisMonth > 0 && (
                <div className="absolute bottom-8 left-12 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {formatCount(siteVisitsThisMonth)} acessos este mês
                      </p>
                      <p className="text-[10px] text-slate-500">visitas ao site no período</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
