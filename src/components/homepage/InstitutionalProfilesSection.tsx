import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, MapPin, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface InstitutionalProfile {
  id: string;
  property_name: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  property_type: string | null;
}

const propertyTypeLabel: Record<string, string> = {
  haras: 'Haras',
  fazenda: 'Fazenda',
  cte: 'Centro de Treinamento',
  'central-reproducao': 'Central de Reprodução',
};

const InstitutionalProfilesSection: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<InstitutionalProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        // Buscar perfis institucionais ativos (pagos) mais recentes — query leve
        // Evita trazer milhares de linhas de page_visits para agrupar no client
        const { data, error } = await supabase
          .from('public_profiles')
          .select('id, property_name, avatar_url, city, state, property_type')
          .eq('account_type', 'institutional')
          .eq('is_active', true)
          .eq('is_suspended', false)
          .neq('plan', 'free')
          .order('created_at', { ascending: false })
          .limit(12);

        if (!error && data) setProfiles(data);

        // Contagem total de haras ativos
        const { count } = await supabase
          .from('public_profiles')
          .select('id', { count: 'exact', head: true })
          .eq('account_type', 'institutional')
          .eq('is_active', true)
          .eq('is_suspended', false)
          .neq('plan', 'free');

        setTotalCount(count || 0);
      } catch (error) {
        console.error('Erro ao carregar perfis institucionais:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  // Não renderizar se não houver perfis
  if (!loading && profiles.length === 0) return null;

  if (loading) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="container-responsive">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-600 mb-2 flex items-center justify-center gap-2">
            <Building2 className="h-3.5 w-3.5" />
            Quem já faz parte
          </p>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
            Eles já estão na Vitrine
          </h2>
        </div>

        {/* Grid de perfis */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {profiles.map((profile) => (
            <Link
              key={profile.id}
              to={`/haras/${profile.id}`}
              className="group bg-white border border-slate-200 rounded-xl p-4 sm:p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center gap-3"
            >
              {/* Avatar / Logo */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 border-2 border-slate-200 group-hover:border-blue-300 overflow-hidden flex items-center justify-center flex-shrink-0 transition-colors">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.property_name || ''}
                    className="w-full h-full object-cover"
                    width={64}
                    height={64}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <Building2 className="w-6 h-6 text-slate-400" />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 w-full">
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate group-hover:text-blue-600 transition-colors">
                  {profile.property_name || 'Propriedade'}
                </h3>
                {profile.property_type && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {propertyTypeLabel[profile.property_type] || profile.property_type}
                  </p>
                )}
                {(profile.city || profile.state) && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {[profile.city, profile.state].filter(Boolean).join(', ')}
                    </span>
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-8 sm:mt-10">
          <p className="text-slate-600 text-sm sm:text-base mb-4">
            Coloque seu haras no mapa
          </p>
          <button
            onClick={() => navigate('/planos')}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base"
          >
            Comece agora
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default InstitutionalProfilesSection;
