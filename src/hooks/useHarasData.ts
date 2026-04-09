import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { buscarCep, UF_TO_ESTADO } from '@/services/cepService';
import { normalizePlanId } from '@/constants/plans';
import { formatNameUppercase } from '@/utils/nameFormat';

export interface HarasAnimal {
  id: string;
  name: string;
  breed?: string;
  gender?: string;
  image_url?: string;
  coat?: string;
  birth_date?: string;
  category?: string;
  images?: string[] | unknown;
  is_boosted?: boolean;
  current_city?: string;
  current_state?: string;
  ad_status?: string;
  [key: string]: unknown;
}

export interface HarasProfile {
  id: string;
  name: string;
  property_name?: string;
  property_type?: string;
  city?: string;
  state?: string;
  avatar_url?: string;
  account_type?: string;
  [key: string]: unknown;
}

export interface HarasDisplayData {
  name: string;
  displayName: string;
  location: string;
  foundedYear: number | string;
  owner: string;
  description: string;
  instagram?: string | null;
  verified: boolean;
  subscription: string;
  logo?: string | null;
  phone?: string | null;
}

interface UseHarasDataResult {
  profile: HarasProfile | null;
  displayData: HarasDisplayData | null;
  garanhoes: HarasAnimal[];
  doadoras: HarasAnimal[];
  potros: HarasAnimal[];
  potras: HarasAnimal[];
  outros: HarasAnimal[];
  loading: boolean;
  errorMessage: string | null;
}

const REQUEST_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout ao ${label}`)), REQUEST_TIMEOUT_MS);
  });
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Hook compartilhado para buscar dados de um haras.
 * Usado tanto pela página /haras/:id quanto pela página isolada /u/:slug.
 *
 * @param id - ID do perfil (UUID) quando já conhecido
 * @param slug - public_code do haras (para rota /u/:slug)
 */
export function useHarasData({ id, slug }: { id?: string; slug?: string }): UseHarasDataResult {
  const [profile, setProfile] = useState<HarasProfile | null>(null);
  const [garanhoes, setGaranhoes] = useState<HarasAnimal[]>([]);
  const [doadoras, setDoadoras] = useState<HarasAnimal[]>([]);
  const [potros, setPotros] = useState<HarasAnimal[]>([]);
  const [potras, setPotras] = useState<HarasAnimal[]>([]);
  const [outros, setOutros] = useState<HarasAnimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchProfileAndAnimals = async () => {
      if (!id && !slug) return;

      setLoading(true);
      setErrorMessage(null);

      try {
        let profileData: HarasProfile | null = null;

        if (slug) {
          // Buscar por public_code (rota /u/:slug)
          const { data, error: fetchError } = await withTimeout(
            supabase
              .from('public_profiles')
              .select('*')
              .eq('public_code', slug.toUpperCase())
              .single(),
            'carregar perfil por código'
          );
          if (fetchError) throw fetchError;
          profileData = data;
        } else if (id) {
          // Buscar por ID (rota /haras/:id)
          const { data, error: fetchError } = await withTimeout(
            supabase
              .from('public_profiles')
              .select('*')
              .eq('id', id)
              .single(),
            'carregar perfil'
          );
          if (fetchError) throw fetchError;
          profileData = data;
        }

        if (!profileData || !mounted) return;

        // Lançar busca de animais em paralelo com normalização de CEP
        const profileId = profileData.id;
        const animalsPromise = withTimeout(
          (supabase.rpc as (name: string, params: Record<string, unknown>) => ReturnType<typeof supabase.rpc>)(
            'get_profile_animals',
            { profile_user_id: profileId }
          ),
          'carregar animais do perfil'
        );

        // Normalizar cidade/estado via CEP se necessário (em paralelo com animais)
        const rawProfile = profileData as typeof profileData & { cep?: string | null };
        let normalizedProfile = rawProfile;
        const needsCep = (!rawProfile?.city || !rawProfile?.state) && rawProfile?.cep;
        const cepPromise = needsCep ? buscarCep(rawProfile.cep!) : null;

        // Aguardar ambos em paralelo
        const [animalsResult, cepResult] = await Promise.all([
          animalsPromise.catch((err) => ({ data: null, error: err })),
          cepPromise,
        ]);

        if (!mounted) return;

        // Aplicar CEP se disponível
        if (cepResult && cepResult.success && cepResult.data) {
          const estadoCompleto = UF_TO_ESTADO[cepResult.data.uf] || cepResult.data.uf;
          normalizedProfile = {
            ...rawProfile,
            city: rawProfile.city || cepResult.data.localidade,
            state: rawProfile.state || estadoCompleto,
          };
        }

        setProfile(normalizedProfile);

        // Processar resultado de animais
        const animalsData = (animalsResult as { data: unknown; error: unknown }).data;
        const animalsError = (animalsResult as { data: unknown; error: unknown }).error;

        if (animalsError) {
          console.error('Erro ao buscar animais:', animalsError);
          setGaranhoes([]);
          setDoadoras([]);
          setPotros([]);
          setPotras([]);
          setOutros([]);
          return;
        }

        interface RPCAnimalResult {
          animal_id: string;
          [key: string]: unknown;
        }
        const animalIds = ((animalsData as unknown as RPCAnimalResult[]) || []).map(
          (a: RPCAnimalResult) => a.animal_id
        );
        let fullAnimalsData: HarasAnimal[] = [];

        if (animalIds.length > 0) {
          const { data: fullData, error: fullError } = await withTimeout(
            supabase.from('animals_with_stats').select('*').in('id', animalIds),
            'carregar detalhes dos animais'
          );
          if (!fullError && fullData) {
            fullAnimalsData = fullData;
          }
        }

        const allAnimals = (fullAnimalsData || []).filter(
          (animal) => animal?.id && animal.ad_status === 'active'
        );

        setGaranhoes(allAnimals.filter((a) => a.category === 'Garanhão'));
        setDoadoras(allAnimals.filter((a) => a.category === 'Doadora'));
        setPotros(allAnimals.filter((a) => a.category === 'Potro'));
        setPotras(allAnimals.filter((a) => a.category === 'Potra'));
        setOutros(
          allAnimals.filter(
            (a) =>
              a.category === 'Outro' ||
              !a.category ||
              !['Garanhão', 'Doadora', 'Potro', 'Potra'].includes(a.category)
          )
        );
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        if (mounted) {
          setErrorMessage('Não foi possível carregar o perfil do haras. Tente novamente em instantes.');
          setGaranhoes([]);
          setDoadoras([]);
          setPotros([]);
          setPotras([]);
          setOutros([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfileAndAnimals();
    return () => {
      mounted = false;
    };
  }, [id, slug]);

  // Montar displayData
  const normalizedPlan = profile ? normalizePlanId(profile?.plan as string | null | undefined) : null;

  const displayData: HarasDisplayData | null = profile
    ? {
        name: profile.property_name || profile.name || 'Haras',
        displayName: formatNameUppercase(profile.property_name || profile.name || 'Haras'),
        location:
          profile.city && profile.state ? `${profile.city}, ${profile.state}` : 'Não informado',
        foundedYear: (profile.founded_year as number | string) || 'N/A',
        owner: (profile.owner_name as string) || profile.name || 'Não informado',
        description: (profile.bio as string) || 'Informações não disponíveis.',
        instagram: (profile.instagram as string | null) || null,
        verified:
          normalizedPlan === 'criador' ||
          normalizedPlan === 'haras' ||
          normalizedPlan === 'elite' ||
          normalizedPlan === 'vip',
        subscription: normalizedPlan || 'free',
        logo: profile.avatar_url as string | undefined,
        phone: (profile.phone as string | null) || null,
      }
    : null;

  return {
    profile,
    displayData,
    garanhoes,
    doadoras,
    potros,
    potras,
    outros,
    loading,
    errorMessage,
  };
}
