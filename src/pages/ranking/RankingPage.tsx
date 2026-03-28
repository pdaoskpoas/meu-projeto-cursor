import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Trophy, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import RankingFilters from './RankingFilters';
import AnimalRankingCard from './AnimalRankingCard';
import { animalService } from '@/services/animalService';
import { useBoostManager } from '@/hooks/useBoostManager';
import { useSupabaseAllAnimalsStats } from '@/hooks/useSupabaseContentStats';
import { getOwnerDisplayName } from '@/utils/ownerDisplayName';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface RankingAnimal {
  id: string;
  name: string;
  breed: string;
  coat: string;
  gender: 'Macho' | 'Fêmea';
  image: string;
  images?: string[];
  currentLocation: {
    city: string;
    state: string;
  };
  harasId: string;
  harasName: string;
  ownerAccountType?: string;
  ownerPropertyType?: string | null;
  titles: string[];
  views: number;
  clicks: number;
  adStatus: string;
  birthDate: string;
  publishedDate: string;
  chip?: string;
  isRegistered: boolean;
  fatherName?: string | null;
  motherName?: string | null;
  isBoostedActive: boolean;
  boostExpiresAt?: string;
}

const normalizeSupabaseImages = (record: Record<string, unknown>): string[] => {
  if (!record) return [];
  const rawImages = Array.isArray(record.images) ? record.images.filter(Boolean) : [];
  if (rawImages.length > 0) {
    return rawImages;
  }
  if (record.cover_image) {
    return [record.cover_image];
  }
  return [];
};

const pickFirstString = (record: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return null;
};

const isBoostActive = (record: Record<string, unknown>) => {
  if (!record?.is_boosted) return false;
  if (!record.boost_expires_at) return true;
  return new Date(record.boost_expires_at).getTime() > Date.now();
};

const getAgeYears = (birthDate?: string) => {
  if (!birthDate) return null;
  const parsed = new Date(birthDate);
  if (Number.isNaN(parsed.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const hasHadBirthday =
    today.getMonth() > parsed.getMonth() ||
    (today.getMonth() === parsed.getMonth() && today.getDate() >= parsed.getDate());
  if (!hasHadBirthday) age -= 1;
  return age;
};

const getVisiblePages = (
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): Array<number | '...'> => {
  const pages: Array<number | '...'> = [];

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const halfVisible = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - halfVisible);
  const end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push('...');
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
  }

  return pages;
};

const SLOW_LOADING_THRESHOLD_MS = 5_000;

const RankingPage = () => {
  const { breed } = useParams();
  const [searchParams] = useSearchParams();
  const { isLoading: authLoading } = useAuth();
  const { isItemBoosted } = useBoostManager();
  const { allStats, isLoading: statsLoading } = useSupabaseAllAnimalsStats();

  // Loading prolongado: exibir mensagem extra se auth demorar mais que 5s
  const [slowLoading, setSlowLoading] = useState(false);
  useEffect(() => {
    if (!authLoading) {
      setSlowLoading(false);
      return;
    }
    const timer = window.setTimeout(() => setSlowLoading(true), SLOW_LOADING_THRESHOLD_MS);
    return () => window.clearTimeout(timer);
  }, [authLoading]);
  
  // Pega os filtros da URL (query string ou params)
  const breedFromQuery = searchParams.get('breed');
  const genderFromQuery = searchParams.get('gender');
  const sortByFromQuery = searchParams.get('sortBy');
  const initialBreed = breedFromQuery || breed || 'all';
  const initialGender = genderFromQuery || 'all';
  const initialSortBy = sortByFromQuery || 'relevant';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBreed, setSelectedBreed] = useState(initialBreed);
  const [selectedGender, setSelectedGender] = useState(initialGender);
  const [selectedCategory, setSelectedCategory] = useState('all');  // Novo filtro de categoria
  const [selectedProfile, setSelectedProfile] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedAwarded, setSelectedAwarded] = useState('all');
  const [selectedAge, setSelectedAge] = useState('all');
  const [selectedRegistered, setSelectedRegistered] = useState('all');
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 14;

  const [dbAnimals, setDbAnimals] = useState<RankingAnimal[]>([]);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const mapAnimalRecord = (
    a: Record<string, unknown>,
    genealogyMap: Record<string, { father_name: string | null; mother_name: string | null }>
  ): RankingAnimal => ({
    id: a.id,
    name: a.name,
    breed: a.breed,
    coat: a.coat ?? '—',
    gender: a.gender,
    image: a.default_image_key ?? 'mangalarga',
    images: normalizeSupabaseImages(a),
    currentLocation: {
      city: a.current_city ?? '—',
      state: a.current_state ?? '—'
    },
    harasId: a.owner_id ?? a.haras_id ?? '0',
    harasName: getOwnerDisplayName(
      a.owner_account_type ?? a.account_type,
      a.owner_name ?? a.haras_name,
      a.owner_property_name ?? a.property_name
    ),
    ownerAccountType: a.owner_account_type,
    ownerPropertyType: a.owner_property_type ?? null,
    titles: [],
    views: a.impression_count ?? 0,
    clicks: a.click_count ?? 0,
    adStatus: a.ad_status ?? 'active',
    birthDate: a.birth_date ?? '2000-01-01',
    publishedDate: a.published_at ?? new Date().toISOString(),
    chip: a.registration_number ?? undefined,
    isRegistered: typeof a.is_registered === 'boolean' ? a.is_registered : true,
    fatherName:
      genealogyMap[a.id]?.father_name ??
      pickFirstString(a, ['father_name', 'father']) ??
      null,
    motherName:
      genealogyMap[a.id]?.mother_name ??
      pickFirstString(a, ['mother_name', 'mother']) ??
      null,
    isBoostedActive: isBoostActive(a),
    boostExpiresAt: a.boost_expires_at ?? undefined
  });

  // Atualizar filtros quando a URL mudar
  useEffect(() => {
    if (breedFromQuery) {
      setSelectedBreed(breedFromQuery);
    } else if (breed) {
      setSelectedBreed(breed);
    }
    
    if (genderFromQuery) {
      setSelectedGender(genderFromQuery);
    }
    
    if (sortByFromQuery) {
      setSortBy(sortByFromQuery);
    }
  }, [breedFromQuery, breed, genderFromQuery, sortByFromQuery]);

  // Ler do Supabase conforme filtros (client-side paginate)
  // Gate: só dispara quando auth bootstrap terminar (isLoading = false),
  // garantindo que o Supabase client já possui JWT válido (ou sessão anônima confirmada).
  useEffect(() => {
    if (authLoading) return;

    let mounted = true;
    setFetchFailed(false);
    (async () => {
      try {
        const list = await animalService.searchAnimals({
          search: searchTerm || null || undefined,
          breed: selectedBreed !== 'all' ? selectedBreed : undefined,
          state: selectedState !== 'all' ? selectedState : undefined,
          city: selectedCity !== 'all' ? selectedCity : undefined,
          gender: selectedGender !== 'all' ? (selectedGender as 'Macho' | 'Fêmea') : undefined,
          category: selectedCategory !== 'all' ? (selectedCategory as 'Garanhão' | 'Castrado' | 'Doadora' | 'Matriz' | 'Potro' | 'Potra' | 'Outro') : undefined,  // Filtro de categoria
          // propertyType: manter indefinido por ora (filtro local usa verificação mock)
          orderBy: sortBy === 'relevant' ? 'ranking' : (sortBy === 'recent' ? 'recent' : (sortBy === 'views' ? 'most_viewed' : 'ranking')),
          limit: 200,
          offset: 0
        });
        if (!mounted) return;
        const ids = (list || []).map((item) => item.id).filter(Boolean);
        let genealogyMap: Record<string, { father_name: string | null; mother_name: string | null }> = {};
        if (ids.length > 0) {
          const { data: genealogyRows, error: genealogyError } = await supabase
            .from('animals')
            .select('id, father_name, mother_name')
            .in('id', ids);
          if (genealogyError) {
            console.error('[RankingPage] Erro ao buscar genealogia:', genealogyError);
          }
          genealogyMap = (genealogyRows || []).reduce((acc, row) => {
            acc[row.id] = {
              father_name: row.father_name ?? null,
              mother_name: row.mother_name ?? null
            };
            return acc;
          }, {} as Record<string, { father_name: string | null; mother_name: string | null }>);
        }
        setDbAnimals((list || []).map((item) => mapAnimalRecord(item, genealogyMap)));
      } catch (error) {
        console.error('[RankingPage] search fallback triggered', error);
        try {
          const fallbackList = await animalService.getRecentAnimals(200);
          if (!mounted) return;
          setDbAnimals((fallbackList || []).map((item) => mapAnimalRecord(item, {})));
        } catch (fallbackError) {
          console.error('[RankingPage] fallback fetch failed', fallbackError);
          if (!mounted) return;
          setDbAnimals([]);
          setFetchFailed(true);
        }
      }
    })();
    return () => { mounted = false; };
  }, [authLoading, searchTerm, selectedBreed, selectedGender, selectedCategory, selectedState, selectedCity, sortBy, retryKey]);

  // ✅ PRODUÇÃO: Usar apenas dados reais do banco, sem fallback para mock
  const sourceHorses: RankingAnimal[] = dbAnimals

  // Filter and sort horses
  const filteredHorses = sourceHorses
    .filter(horse => horse.adStatus === 'active')
    .filter(horse => {
      const matchesSearch = horse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           horse.harasName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBreed = selectedBreed === 'all' || horse.breed === selectedBreed;
      const matchesGender = selectedGender === 'all' || horse.gender === selectedGender;
      
      // Profile filter based on account type
      const matchesProfile = selectedProfile === 'all' || 
        (selectedProfile === 'institutional' && horse.ownerAccountType === 'institutional') ||
        (selectedProfile === 'personal' && horse.ownerAccountType === 'personal');
      
      // Location filter based on currentLocation
      const matchesState = selectedState === 'all' || horse.currentLocation.state === selectedState;
      const matchesCity = selectedCity === 'all' || horse.currentLocation.city === selectedCity;
      const matchesLocation = matchesState && matchesCity;
      
      // Awarded filter based on titles
      const matchesAwarded = selectedAwarded === 'all' || 
        (selectedAwarded === 'Sim' && horse.titles.length > 0) ||
        (selectedAwarded === 'Não' && horse.titles.length === 0);

      // Age filter based on birth date
      const ageYears = getAgeYears(horse.birthDate);
      const matchesAge = selectedAge === 'all' || (
        ageYears !== null && (
          (selectedAge === '0-2' && ageYears <= 2) ||
          (selectedAge === '3-5' && ageYears >= 3 && ageYears <= 5) ||
          (selectedAge === '6-10' && ageYears >= 6 && ageYears <= 10) ||
          (selectedAge === '11-15' && ageYears >= 11 && ageYears <= 15) ||
          (selectedAge === '16+' && ageYears >= 16)
        )
      );
      
      // Registered filter based on registro oficial
      const matchesRegistered = selectedRegistered === 'all' || 
        (selectedRegistered === 'Sim' && horse.isRegistered) ||
        (selectedRegistered === 'Não' && !horse.isRegistered);
      
      return matchesSearch && matchesBreed && matchesGender && matchesProfile && matchesLocation && matchesAwarded && matchesAge && matchesRegistered;
    })
    .sort((a, b) => {
      const getClicks = (animal: RankingAnimal) => allStats[animal.id]?.clicks ?? animal.clicks ?? 0;
      const getViews = (animal: RankingAnimal) => allStats[animal.id]?.views ?? animal.views ?? 0;
      switch (sortBy) {
        case 'relevant': {
          const aBoosted = a.isBoostedActive || isItemBoosted(a.id, 'animal');
          const bBoosted = b.isBoostedActive || isItemBoosted(b.id, 'animal');
          if (aBoosted !== bBoosted) {
            return aBoosted ? -1 : 1;
          }
          const aClicks = getClicks(a);
          const bClicks = getClicks(b);
          if (aClicks !== bClicks) {
            return bClicks - aClicks;
          }
          const aViews = getViews(a);
          const bViews = getViews(b);
          if (aViews !== bViews) {
            return bViews - aViews;
          }
          return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
        }
        case 'recent':
          return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
        case 'views': {
          const aClicks = getClicks(a);
          const bClicks = getClicks(b);
          if (aClicks !== bClicks) {
            return bClicks - aClicks;
          }
          const aViews = getViews(a);
          const bViews = getViews(b);
          if (aViews !== bViews) {
            return bViews - aViews;
          }
          return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
        }
        default:
          return 0;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredHorses.length / itemsPerPage);
  const safeTotalPages = Math.max(totalPages, 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHorses = filteredHorses.slice(startIndex, startIndex + itemsPerPage);
  const visiblePages = getVisiblePages(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedBreed,
    selectedGender,
    selectedCategory,
    selectedProfile,
    selectedState,
    selectedCity,
    selectedAwarded,
    selectedAge,
    selectedRegistered,
    sortBy
  ]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedBreed('all');
    setSelectedGender('all');
    setSelectedCategory('all');  // Limpar filtro de categoria
    setSelectedProfile('all');
    setSelectedState('all');
    setSelectedCity('all');
    setSelectedAwarded('all');
    setSelectedAge('all');
    setSelectedRegistered('all');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Loading state: exibir skeleton enquanto auth bootstrap não completou.
  // Mantém a mesma estrutura visual (header + grid 1+3) para evitar layout shift.
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
          {/* Header skeleton */}
          <div className="flex items-center mb-8 sm:mb-12">
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Filters skeleton */}
            <div className="lg:col-span-1">
              <Card className="p-4 sm:p-6">
                <Skeleton className="h-6 w-24 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </Card>
            </div>

            {/* Results skeleton */}
            <div className="lg:col-span-3">
              {/* Results header skeleton */}
              <div className="mb-6">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-28" />
              </div>

              {/* Cards grid skeleton — 6 cards replica o layout real */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    {/* Imagem placeholder — mesma altura do card real */}
                    <Skeleton className="h-48 sm:h-64 w-full rounded-none" />
                    <div className="p-4 sm:p-6">
                      {/* Nome */}
                      <Skeleton className="h-6 w-3/4 mb-3" />
                      {/* Badges (raça, sexo, idade) */}
                      <div className="flex gap-2 mb-3">
                        <Skeleton className="h-5 w-28 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                      {/* Haras info */}
                      <Skeleton className="h-4 w-2/3 mb-3" />
                      {/* Genealogia */}
                      <div className="pt-3 border-t border-slate-100">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-40 mb-1" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                      {/* Localização */}
                      <Skeleton className="h-4 w-1/2 mt-3" />
                    </div>
                  </Card>
                ))}
              {/* Mensagem de loading prolongado */}
              {slowLoading && (
                <p className="text-center text-sm text-slate-500 mt-8 animate-fade-in">
                  A conexão está lenta, ainda estamos carregando os dados…
                </p>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Header */}
        <div className="flex items-center mb-8 sm:mb-12">
          <BackButton fallbackPath="/" variant="ghost" showLabel={false} className="h-10 w-10 rounded-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Filters */}
          <div className="lg:col-span-1">
            <RankingFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedBreed={selectedBreed}
              setSelectedBreed={setSelectedBreed}
              selectedGender={selectedGender}
              setSelectedGender={setSelectedGender}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedProfile={selectedProfile}
              setSelectedProfile={setSelectedProfile}
              selectedState={selectedState}
              setSelectedState={setSelectedState}
              selectedCity={selectedCity}
              setSelectedCity={setSelectedCity}
              selectedAwarded={selectedAwarded}
              setSelectedAwarded={setSelectedAwarded}
              selectedAge={selectedAge}
              setSelectedAge={setSelectedAge}
              selectedRegistered={selectedRegistered}
              setSelectedRegistered={setSelectedRegistered}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onClearFilters={clearFilters}
            />
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                  {filteredHorses.length} {filteredHorses.length === 1 ? 'animal encontrado' : 'animais encontrados'}
                </h2>
                <p className="text-sm text-slate-600">
                  Página {currentPage} de {safeTotalPages}
                </p>
              </div>
            </div>

            {/* Animals Grid */}
            {paginatedHorses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-fr">
                {paginatedHorses.map((horse, index) => (
                  <AnimalRankingCard
                    key={horse.id}
                    animal={horse}
                    index={startIndex + index}
                    isBoosted={horse.isBoostedActive || isItemBoosted(horse.id, 'animal')}
                  />
                ))}
              </div>
            ) : fetchFailed ? (
              <Card className="p-8 sm:p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <RefreshCw className="h-8 w-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Não foi possível carregar os dados
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Verifique sua conexão com a internet e tente novamente.
                  </p>
                  <Button onClick={() => setRetryKey(k => k + 1)} variant="default">
                    Tentar novamente
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-8 sm:p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Nenhum animal encontrado
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Tente ajustar os filtros ou limpar a busca para ver mais resultados.
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    Limpar Filtros
                  </Button>
                </div>
              </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 sm:px-4 text-sm"
                  >
                    <ChevronLeft className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Anterior</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    {visiblePages.map((page, index) => {
                      if (page === '...') {
                        return (
                          <span
                            key={`ellipsis-${index}`}
                            className="h-11 sm:h-10 w-10 flex items-center justify-center text-slate-500"
                          >
                            ...
                          </span>
                        );
                      }

                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          onClick={() => handlePageChange(page)}
                          className="w-10 text-sm"
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 sm:px-4 text-sm"
                  >
                    <span className="hidden sm:inline">Próxima</span>
                    <ChevronRight className="h-4 w-4 sm:ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingPage;
