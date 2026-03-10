import React, { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import { LogoCarousel, type Logo } from '@/components/sponsors/LogoCarousel';
import SponsorService from '@/services/sponsorService';

const SponsorsCarousel: React.FC = () => {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const schedule = (cb: () => void) => {
      if ('requestIdleCallback' in window) {
        return (window as Window & { requestIdleCallback?: (fn: () => void) => number })
          .requestIdleCallback?.(cb);
      }
      return window.setTimeout(cb, 800);
    };

    const id = schedule(() => {
      if (!cancelled) {
        loadSponsors();
      }
    });

    return () => {
      cancelled = true;
      if (typeof id === 'number') {
        if ('cancelIdleCallback' in window) {
          (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
        } else {
          clearTimeout(id);
        }
      }
    };
  }, []);

  const loadSponsors = async () => {
    try {
      const sponsors = await SponsorService.getActiveSponsors('home');
      
      // Converter para formato esperado pelo LogoCarousel
      const sponsorLogos: Logo[] = sponsors
        .filter(s => s.logo_url) // Apenas sponsors com logo
        .map((sponsor, index) => ({
          id: index + 1,
          name: sponsor.name,
          img: sponsor.logo_url || '',
          url: sponsor.website_url,
          sponsorId: sponsor.id,
        }));

      setLogos(sponsorLogos);
      
      // Registrar impressões (uma vez por carregamento)
      sponsors.forEach(sponsor => {
        SponsorService.recordImpression(sponsor.id);
      });
    } catch (error) {
      console.error('Erro ao carregar patrocinadores:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-slate-50 py-10 sm:py-12 lg:py-14 border-y border-slate-200">
        <div className="container-responsive">
          <div className="animate-pulse space-y-6 sm:space-y-8">
            <div className="mx-auto h-8 w-64 rounded-full bg-slate-200" />
            <div className="mx-auto h-6 w-96 rounded bg-slate-200" />
            <div className="h-24 w-full rounded-xl bg-slate-200" />
          </div>
        </div>
      </section>
    );
  }

  // Se não houver sponsors, não renderiza nada
  if (logos.length === 0) {
    return null;
  }

  return (
    <section 
      className="bg-slate-50 py-10 sm:py-12 lg:py-14 border-y border-slate-200"
      aria-label="Nossos parceiros"
    >
      <div className="container-responsive">
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-sm font-medium text-blue-700">
              <Award className="h-4 w-4" aria-hidden="true" />
              <span>Parceiros de confiança</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Empresas que confiam na <span className="text-blue-600">Vitrine do Cavalo</span>
            </h2>
          </div>

          {/* Carrossel */}
          <div className="relative">
            <LogoCarousel logos={logos} speed={35} />
          </div>

          {/* Footer hint */}
          <p className="text-center text-xs sm:text-sm text-slate-500 italic">
            Passe o mouse sobre os logos para pausar
          </p>
        </div>
      </div>
    </section>
  );
};

export default SponsorsCarousel;
