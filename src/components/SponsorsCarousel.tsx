import React, { useState, useEffect } from 'react';
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
        .map((sponsor, index) => {
          const linkedProfileId = (sponsor as Record<string, unknown>).linked_profile_id as string | undefined;
          const clickActionEnabled = (sponsor as Record<string, unknown>).click_action_enabled as boolean | undefined;
          return {
            id: index + 1,
            name: sponsor.name,
            img: sponsor.logo_url || '',
            url: sponsor.website_url,
            sponsorId: sponsor.id,
            linkedProfileId,
            // Se a coluna ainda não existe na view (migration pendente),
            // ativa automaticamente quando há destino configurado
            clickActionEnabled: clickActionEnabled ?? !!(linkedProfileId || sponsor.website_url),
          };
        });

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
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-4">
              <span className="block w-10 h-px bg-blue-400" />
              <span className="text-xs font-semibold tracking-[0.25em] uppercase text-blue-600">
                Patrocinadores Oficiais
              </span>
              <span className="block w-10 h-px bg-blue-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Marcas que impulsionam e fortalecem a <span className="text-blue-600">Vitrine do Cavalo</span>
            </h2>
          </div>

          {/* Carrossel */}
          <div className="relative">
            <LogoCarousel logos={logos} speed={35} />
          </div>

          {/* Footer hint — apenas desktop */}
          <p className="text-center text-xs sm:text-sm text-slate-500 italic hidden sm:block">
            Passe o mouse sobre os logos para pausar
          </p>
        </div>
      </div>
    </section>
  );
};

export default SponsorsCarousel;
