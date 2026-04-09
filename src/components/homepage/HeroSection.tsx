
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Eye, Users, CheckCircle2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  // Usa impressões do mês se disponíveis, caso contrário cai para o total all-time do DB
  const rawTopMale = topMales[0] as unknown as Record<string, unknown> | undefined;
  const rawTopFemale = topFemales[0] as unknown as Record<string, unknown> | undefined;
  const topMaleViews = rawTopMale
    ? (Number(rawTopMale.impressions) > 0 ? Number(rawTopMale.impressions) : Number(rawTopMale.impression_count) || 0)
    : 0;
  const topFemaleViews = rawTopFemale
    ? (Number(rawTopFemale.impressions) > 0 ? Number(rawTopFemale.impressions) : Number(rawTopFemale.impression_count) || 0)
    : 0;

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

  const formatCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <section
      className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 overflow-hidden"
      aria-label="Seção principal"
    >
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative container-responsive py-10 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* ── Coluna esquerda: copy + CTAs ── */}
          <div className="space-y-6 sm:space-y-8">

            {/* Eyebrow — editorial treatment */}
            <div className="inline-flex items-center gap-3">
              <span className="w-8 h-px bg-blue-400/40" />
              <span className="text-[11px] font-semibold text-blue-300/80 tracking-[0.22em] uppercase">
                A maior vitrine equestre do Brasil
              </span>
              <span className="w-8 h-px bg-blue-400/40" />
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] font-bold text-white leading-[1.1]">
                Coloque seus cavalos{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-300">
                  na frente de quem está buscando
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-blue-100/70 leading-relaxed max-w-lg">
                Cadastre seu plantel, acompanhe visualizações e cliques em tempo real, e seja encontrado por criadores e entusiastas em todo o Brasil.
              </p>
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* CTA principal — conversão de haras */}
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-blue-500 hover:bg-blue-400 text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 text-base px-6 border-0"
                  onClick={() => navigate('/register')}
                >
                  Destacar meu cavalo
                </Button>

                {/* CTA secundário */}
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border-white/20 hover:border-white/40 text-white font-semibold transition-all duration-200 text-base px-6"
                  onClick={() => navigate('/buscar')}
                >
                  Explorar animais
                </Button>
              </div>

              {/* CTA vitrine — scroll para seção de perfis */}
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border-2 border-white/30 hover:border-white/50 text-white font-bold shadow-lg shadow-black/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 text-sm sm:text-base px-5 sm:px-6 gap-2"
                onClick={() => document.getElementById('vitrine-profiles')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver quem já está na vitrine
                <ChevronDown className="h-4 w-4 animate-bounce" style={{ animationDuration: '2s' }} />
              </Button>

              {/* Microcopy — reduz fricção */}
              <div className="flex items-center gap-4 text-xs text-blue-300/60">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-400/70" />
                  Leva menos de 2 minutos
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-400/70" />
                  A partir de <span className="text-blue-200 font-semibold">R$ 33,25/mês</span>
                </span>
              </div>
            </div>

            {/* Prova social — números que geram confiança */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-1">
              <div className="bg-white/8 rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/10 text-center">
                <p className="text-lg sm:text-2xl font-bold text-white">8,5k+</p>
                <p className="text-[10px] sm:text-xs text-blue-200/55 leading-tight mt-0.5">cavalos anunciados</p>
              </div>
              <div className="bg-white/8 rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/10 text-center">
                <p className="text-lg sm:text-2xl font-bold text-white">150+</p>
                <p className="text-[10px] sm:text-xs text-blue-200/55 leading-tight mt-0.5">haras cadastrados</p>
              </div>
              <div className="bg-white/8 rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/10 text-center">
                <p className="text-lg sm:text-2xl font-bold text-white">27</p>
                <p className="text-[10px] sm:text-xs text-blue-200/55 leading-tight mt-0.5">estados cobertos</p>
              </div>
            </div>

            {/* Scroll hint — mobile */}
            <div className="flex justify-center pt-1 sm:hidden animate-bounce" style={{ animationDuration: '2s' }}>
              <ChevronDown className="h-5 w-5 text-blue-300/40" />
            </div>
          </div>

          {/* ── Coluna direita: prova visual — animais reais com métricas ── */}
          <div className="relative hidden lg:block" aria-hidden="true">
            <div className="relative w-full h-[440px]">

              {/* Card top garanhão */}
              <Link
                to={topMale ? `/animal/${topMale.id}` : '/ranking'}
                className="absolute top-4 left-8 w-[265px] bg-white rounded-2xl shadow-2xl overflow-hidden transform -rotate-3 hover:rotate-0 hover:scale-[1.02] transition-all duration-500 block group"
              >
                <div className="h-[185px] bg-slate-200 overflow-hidden relative">
                  {topMale && topMale.images.length > 0 ? (
                    <LazyImage
                      src={topMale.images[0]}
                      alt={topMale.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <span className="text-4xl">♂</span>
                    </div>
                  )}

                  {/* Métricas sobrepostas na imagem — prova de resultado */}
                  <div className="absolute bottom-2 left-2 right-2 flex gap-1.5 justify-end">
                    {topMaleViews > 0 && (
                      <div className="bg-black/65 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                        <Eye className="h-3 w-3 text-blue-300" />
                        {formatCount(topMaleViews)} visualizações
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-wider text-blue-600 font-semibold mb-0.5">
                    Top Garanhão do mês
                  </p>
                  <p className="font-bold text-slate-900 text-sm truncate">
                    {topMale?.name || 'Carregando...'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
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
                className="absolute top-14 right-4 w-[265px] bg-white rounded-2xl shadow-2xl overflow-hidden transform rotate-2 hover:rotate-0 hover:scale-[1.02] transition-all duration-500 block group"
              >
                <div className="h-[185px] bg-slate-200 overflow-hidden relative">
                  {topFemale && topFemale.images.length > 0 ? (
                    <LazyImage
                      src={topFemale.images[0]}
                      alt={topFemale.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <span className="text-4xl">♀</span>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 right-2 flex gap-1.5 justify-end">
                    {topFemaleViews > 0 && (
                      <div className="bg-black/65 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                        <Eye className="h-3 w-3 text-blue-300" />
                        {formatCount(topFemaleViews)} visualizações
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-wider text-blue-600 font-semibold mb-0.5">
                    Top Doadora do mês
                  </p>
                  <p className="font-bold text-slate-900 text-sm truncate">
                    {topFemale?.name || 'Carregando...'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {topFemale ? `${topFemale.breed} · ${topFemale.harasName}` : '—'}
                  </p>
                  {topFemale && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                      <MapPin className="h-3 w-3" />
                      <span>{topFemale.currentLocation.city}, {topFemale.currentLocation.state}</span>
                    </div>
                  )}
                </div>
              </Link>

              {/* Badge de acessos — prova de audiência ativa */}
              {siteVisitsThisMonth > 0 && (
                <div className="absolute bottom-6 left-10 bg-white rounded-xl px-4 py-3 shadow-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {formatCount(siteVisitsThisMonth)} visitas este mês
                      </p>
                      <p className="text-[10px] text-slate-500">pessoas buscando cavalos agora</p>
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
