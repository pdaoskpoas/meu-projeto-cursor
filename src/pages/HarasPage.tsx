import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, User, Verified, Instagram, ExternalLink, Crown, Star, Trophy, Building2, MessageCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import SendMessageButton from '@/components/SendMessageButton';
import HarasEventsSection from '@/components/haras/HarasEventsSection';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { animalService } from '@/services/animalService';
import { analyticsService } from '@/services/analyticsService';
import { supabase } from '@/lib/supabase';
import { buscarCep, UF_TO_ESTADO } from '@/services/cepService';
import { normalizePlanId } from '@/constants/plans';
import { formatNameUppercase } from '@/utils/nameFormat';
import mangalargaImg from '@/assets/mangalarga.jpg';
import thoroughbredImg from '@/assets/thoroughbred.jpg';
import quarterHorseImg from '@/assets/quarter-horse.jpg';

// Tipos para os dados
interface HarasAnimal {
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
  [key: string]: unknown;
}

// 📊 Componente interno com tracking integrado para cards de animais
const HarasAnimalCard: React.FC<{
  animal: HarasAnimal;
  index: number;
  category: 'Garanhão' | 'Doadora';
  userId?: string;
}> = ({ animal, index, category, userId }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);
  const displayAnimalName = formatNameUppercase(animal.name);

  // 📊 Tracking de impressão quando card entra no viewport (50% visível)
  useEffect(() => {
    if (!cardRef.current || hasTracked.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            // Registrar impressão usando o MESMO serviço
            analyticsService.recordImpression('animal', animal.id, userId, {
              pageUrl: window.location.href,
              carouselName: `haras_${category.toLowerCase()}`,
              carouselPosition: index
            });
            hasTracked.current = true;
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [animal.id, userId, index, category]);

  // 📊 Handler para clique no card
  const handleCardClick = () => {
    analyticsService.recordClick('animal', animal.id, userId, {
      clickTarget: `haras_${category.toLowerCase()}_card`,
      pageUrl: window.location.href
    });
  };

  return (
    <div 
      ref={cardRef}
      key={animal.id} 
      className="bg-white rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden flex flex-col"
    >
      <Link to={`/animal/${animal.id}`} onClick={handleCardClick} className="flex flex-col h-full">
        {/* Image Section */}
        <div className="relative">
          <div className="aspect-square overflow-hidden">
            <img
              src={animal.images?.[0] || mangalargaImg}
              alt={displayAnimalName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          
          {animal.is_boosted && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-orange-500 text-white text-xs font-medium px-2 py-1">
                <Crown className="h-3 w-3 mr-1" />
                Destaque
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
            {displayAnimalName}
          </h3>
          
          <p className="text-slate-600 text-sm mb-3">
            {animal.breed} • {animal.coat || '—'}
          </p>
          
          <p className={`font-semibold text-sm mb-4 ${category === 'Garanhão' ? 'text-blue-600' : 'text-pink-600'}`}>
            {category === 'Garanhão' ? '♂ Garanhão' : '♀ Doadora'}
          </p>

          <div className="flex-grow"></div>

          <div className="space-y-3 mt-auto">
            <p className="text-slate-500 text-sm">
              {animal.current_city as string}, {animal.current_state as string}
            </p>
            
            <button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
              Ver Detalhes
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
};

const HarasPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { startConversation } = useChat();
  
  // Tipos para os dados
  interface HarasProfile {
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

  interface DisplayData {
    name: string;
    location: string;
    foundedYear: number | string;
    owner: string;
    description: string;
    instagram?: string | null;
    verified: boolean;
    subscription: string;
    logo?: string | null;
  }

  // Estados para controlar os animais
  const [profile, setProfile] = useState<HarasProfile | null>(null);
  const [garanhoes, setGaranhoes] = useState<HarasAnimal[]>([]);
  const [doadoras, setDoadoras] = useState<HarasAnimal[]>([]);
  const [potros, setPotros] = useState<HarasAnimal[]>([]);
  const [potras, setPotras] = useState<HarasAnimal[]>([]);
  const [outros, setOutros] = useState<HarasAnimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Estados para controlar a visualização "Ver Todos"
  const [showAllGaranhoes, setShowAllGaranhoes] = useState(false);
  const [showAllDoadoras, setShowAllDoadoras] = useState(false);
  const [showAllPotros, setShowAllPotros] = useState(false);
  const [showAllPotras, setShowAllPotras] = useState(false);
  const [showAllOutros, setShowAllOutros] = useState(false);
  
  const INITIAL_DISPLAY_COUNT = 5;
  
  // Buscar dados do perfil e animais do Supabase
  useEffect(() => {
    let mounted = true;
    const REQUEST_TIMEOUT_MS = 15000;

    const withTimeout = async <T,>(promise: Promise<T>, label: string): Promise<T> => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout ao ${label}`)), REQUEST_TIMEOUT_MS);
      });
      return Promise.race([promise, timeoutPromise]);
    };

    const fetchProfileAndAnimals = async () => {
      if (!id) return;
      
      setLoading(true);
      setErrorMessage(null);
      try {
        // Buscar perfil do usuário (view pública - sem dados sensíveis)
        const { data: profileData, error: profileError } = await withTimeout(
          supabase
            .from('public_profiles')
            .select('*')
            .eq('id', id)
            .single(),
          'carregar perfil'
        );
        
        if (profileError) throw profileError;
        if (!mounted) return;
        
        const rawProfile = profileData as typeof profileData & {
          city?: string | null;
          state?: string | null;
          cep?: string | null;
        };
        let normalizedProfile = rawProfile;
        if ((!rawProfile?.city || !rawProfile?.state) && rawProfile?.cep) {
          const cepResult = await buscarCep(rawProfile.cep);
          if (cepResult.success && cepResult.data) {
            const estadoCompleto = UF_TO_ESTADO[cepResult.data.uf] || cepResult.data.uf;
            normalizedProfile = {
              ...rawProfile,
              city: rawProfile.city || cepResult.data.localidade,
              state: rawProfile.state || estadoCompleto
            };
          }
        }
        
        setProfile(normalizedProfile);
        
        // Buscar animais considerando sociedades
        // Usa função SQL que retorna animais próprios + sociedades aceitas (se usuário tem plano ativo)
        const { data: animalsData, error: animalsError } = await withTimeout(
          (supabase.rpc as (name: string, params: Record<string, unknown>) => ReturnType<typeof supabase.rpc>)(
            'get_profile_animals',
            { profile_user_id: id }
          ),
          'carregar animais do perfil'
        );
        
        if (animalsError) {
          console.error('Erro ao buscar animais:', animalsError);
          if (!mounted) return;
          setGaranhoes([]);
          setDoadoras([]);
          return;
        }
        
        if (!mounted) return;
        
        // Buscar detalhes completos dos animais (a função RPC retorna dados simplificados)
        interface RPCAnimalResult {
          animal_id: string;
          [key: string]: unknown;
        }
        const animalIds = ((animalsData as unknown as RPCAnimalResult[]) || []).map((a: RPCAnimalResult) => a.animal_id);
        let fullAnimalsData: HarasAnimal[] = [];
        
        if (animalIds.length > 0) {
          const { data: fullData, error: fullError } = await withTimeout(
            supabase
              .from('animals_with_stats')
              .select('*')
              .in('id', animalIds),
            'carregar detalhes dos animais'
          );
          
          if (!fullError && fullData) {
            fullAnimalsData = fullData;
          }
        }
        
        // Separar animais por categoria
        const allAnimals = (fullAnimalsData || []).filter(
          (animal) => animal?.id && animal.ad_status === 'active'
        );
        
        const garanhoesFiltered = allAnimals.filter((a) => a.category === 'Garanhão');
        const doadorasFiltered = allAnimals.filter((a) => a.category === 'Doadora');
        const potrosFiltered = allAnimals.filter((a) => a.category === 'Potro');
        const potrasFiltered = allAnimals.filter((a) => a.category === 'Potra');
        const outrosFiltered = allAnimals.filter((a) => a.category === 'Outro' || (!a.category || (a.category !== 'Garanhão' && a.category !== 'Doadora' && a.category !== 'Potro' && a.category !== 'Potra')));
        
        setGaranhoes(garanhoesFiltered);
        setDoadoras(doadorasFiltered);
        setPotros(potrosFiltered);
        setPotras(potrasFiltered);
        setOutros(outrosFiltered);
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
    return () => { mounted = false; };
  }, [id]);

  const getImageSrc = (imageName: string) => {
    switch (imageName) {
      case 'mangalarga': return mangalargaImg;
      case 'thoroughbred': return thoroughbredImg;
      case 'quarter-horse': return quarterHorseImg;
      default: return mangalargaImg;
    }
  };

  if (loading) {
    return (
      <main className="container-responsive section-spacing min-h-screen bg-background">
        <div className="text-center space-content">
          <p className="text-gray-medium">Carregando informações do haras...</p>
        </div>
      </main>
    );
  }

  if (!loading && errorMessage) {
    return (
      <main className="container-responsive section-spacing min-h-screen bg-background">
        <div className="text-center space-content">
          <h1 className="text-2xl font-semibold text-blue-dark">Erro ao carregar haras</h1>
          <p className="text-gray-medium">{errorMessage}</p>
          <Button className="btn-primary mt-4" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </main>
    );
  }
  
  // Criar objeto unificado de exibição com dados reais
  const normalizedPlan = normalizePlanId(profile?.plan as string | null | undefined);

  const displayData: DisplayData | null = profile ? {
    name: profile.property_name || profile.name || 'Haras',
    location: profile.city && profile.state ? `${profile.city}, ${profile.state}` : 'Não informado',
    foundedYear: (profile.founded_year as number | string) || 'N/A',
    owner: (profile.owner_name as string) || profile.name || 'Não informado',
    description: (profile.bio as string) || 'Informações não disponíveis.',
    instagram: (profile.instagram as string | null) || null,
    verified: normalizedPlan === 'criador' || normalizedPlan === 'haras' || normalizedPlan === 'elite' || normalizedPlan === 'vip',
    subscription: normalizedPlan || 'free',
    logo: profile.avatar_url as string | undefined,
  } : null;
  const displayHarasName = formatNameUppercase(displayData?.name);
  
  if (!displayData) {
    // Só mostra "não encontrado" se realmente não há dados
    return (
      <main className="container-responsive section-spacing min-h-screen bg-background">
          <div className="text-center space-content">
            <h1 className="text-2xl font-semibold text-blue-dark">Haras não encontrado</h1>
            <p className="text-gray-medium">O haras solicitado não foi encontrado em nossa base de dados.</p>
            <Link to="/">
              <Button className="btn-primary">Voltar ao Início</Button>
            </Link>
          </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header Minimalista */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Navigation */}
          <div className="mb-4">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Início
            </Link>
          </div>

          {/* Header com Logo e Informações */}
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
              {displayData.logo ? (
                <img
                  src={displayData.logo}
                  alt={`Logo ${displayHarasName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                  <Building2 className="h-12 w-12 text-blue-600" />
                </div>
              )}
            </div>

            {/* Informações Principais */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                    {displayHarasName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{displayData.location}</span>
                    </div>
                    {displayData.foundedYear && displayData.foundedYear !== 'N/A' && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>Fundado em {displayData.foundedYear}</span>
                      </div>
                    )}
                    {displayData.owner && displayData.owner !== 'Não informado' && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-4 w-4" />
                        <span>{displayData.owner}</span>
                      </div>
                    )}
                  </div>
                </div>
                {displayData.verified && (
                  <Badge className="bg-blue-600 text-white text-xs px-3 py-1">
                    <Verified className="h-3 w-3 mr-1" />
                    Membro Premium
                  </Badge>
                )}
              </div>

              {/* Instagram Link (se tiver plano ativo) */}
              {displayData.instagram && (
                <a 
                  href={`https://instagram.com/${displayData.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 transition-colors text-sm font-medium"
                >
                  <Instagram className="h-4 w-4" />
                  @{displayData.instagram.replace('@', '')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Coluna Principal - 3/4 */}
          <div className="lg:col-span-3 space-y-6">
            {/* Sobre o Haras */}
            {displayData.description && displayData.description !== 'Informações não disponíveis.' && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Sobre</h2>
                <p className="text-slate-600 leading-relaxed">{displayData.description}</p>
              </Card>
            )}

            {/* Garanhões Section */}
            {garanhoes.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Garanhões ({garanhoes.length})
                  </h2>
                  {garanhoes.length > INITIAL_DISPLAY_COUNT && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllGaranhoes(!showAllGaranhoes)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {showAllGaranhoes ? 'Ver menos' : `Ver todos (${garanhoes.length})`}
                      <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showAllGaranhoes ? 'rotate-90' : ''}`} />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(showAllGaranhoes ? garanhoes : garanhoes.slice(0, INITIAL_DISPLAY_COUNT)).map((animal, index) => (
                    <HarasAnimalCard 
                      key={animal.id}
                      animal={animal}
                      index={index}
                      category="Garanhão"
                      userId={user?.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Doadoras Section */}
            {doadoras.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Doadoras ({doadoras.length})
                  </h2>
                  {doadoras.length > INITIAL_DISPLAY_COUNT && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllDoadoras(!showAllDoadoras)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {showAllDoadoras ? 'Ver menos' : `Ver todos (${doadoras.length})`}
                      <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showAllDoadoras ? 'rotate-90' : ''}`} />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(showAllDoadoras ? doadoras : doadoras.slice(0, INITIAL_DISPLAY_COUNT)).map((animal, index) => (
                    <HarasAnimalCard 
                      key={animal.id}
                      animal={animal}
                      index={index}
                      category="Doadora"
                      userId={user?.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Potros Section */}
            {potros.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Potros ({potros.length})
                  </h2>
                  {potros.length > INITIAL_DISPLAY_COUNT && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllPotros(!showAllPotros)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {showAllPotros ? 'Ver menos' : `Ver todos (${potros.length})`}
                      <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showAllPotros ? 'rotate-90' : ''}`} />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(showAllPotros ? potros : potros.slice(0, INITIAL_DISPLAY_COUNT)).map((animal, index) => (
                    <HarasAnimalCard 
                      key={animal.id}
                      animal={animal}
                      index={index}
                      category="Garanhão"
                      userId={user?.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Potras Section */}
            {potras.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Potras ({potras.length})
                  </h2>
                  {potras.length > INITIAL_DISPLAY_COUNT && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllPotras(!showAllPotras)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {showAllPotras ? 'Ver menos' : `Ver todos (${potras.length})`}
                      <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showAllPotras ? 'rotate-90' : ''}`} />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(showAllPotras ? potras : potras.slice(0, INITIAL_DISPLAY_COUNT)).map((animal, index) => (
                    <HarasAnimalCard 
                      key={animal.id}
                      animal={animal}
                      index={index}
                      category="Doadora"
                      userId={user?.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Outros Section */}
            {outros.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Outros Animais ({outros.length})
                  </h2>
                  {outros.length > INITIAL_DISPLAY_COUNT && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllOutros(!showAllOutros)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {showAllOutros ? 'Ver menos' : `Ver todos (${outros.length})`}
                      <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showAllOutros ? 'rotate-90' : ''}`} />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(showAllOutros ? outros : outros.slice(0, INITIAL_DISPLAY_COUNT)).map((animal, index) => (
                    <HarasAnimalCard 
                      key={animal.id}
                      animal={animal}
                      index={index}
                      category="Garanhão"
                      userId={user?.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {garanhoes.length === 0 && doadoras.length === 0 && potros.length === 0 && potras.length === 0 && outros.length === 0 && !loading && (
              <Card className="p-8 text-center">
                <p className="text-slate-500">Esta propriedade ainda não possui animais cadastrados.</p>
              </Card>
            )}

            {/* Loading State */}
            {loading && (
              <Card className="p-8 text-center">
                <p className="text-slate-500">Carregando animais...</p>
              </Card>
            )}
          </div>

          {/* Sidebar - 1/4 */}
          <div className="lg:col-span-1 space-y-6">
            {/* Botão Enviar Mensagem */}
            <Card className="p-6">
              <Button
                onClick={async () => {
                  if (!user) {
                    window.location.href = '/login';
                    return;
                  }
                  
                  // Não pode enviar mensagem para si mesmo
                  if (user.id === id) {
                    toast.error('Você não pode enviar mensagem para si mesmo');
                    return;
                  }
                  
                  try {
                    // Criar conversa direta com o haras (não sobre um animal específico)
                    // Usa o primeiro animal como referência técnica, mas marca como "Mensagem Direta"
                    const firstAnimalId = garanhoes[0]?.id || doadoras[0]?.id || potros[0]?.id || potras[0]?.id || outros[0]?.id;
                    
                    if (!firstAnimalId) {
                      toast.error('Este haras ainda não possui animais cadastrados para iniciar uma conversa.');
                      return;
                    }
                    
                    const conversationId = await startConversation(
                      firstAnimalId, // ID do primeiro animal (referência técnica)
                      'Mensagem Direta', // Marca como mensagem direta ao haras
                      id as string, // ID do proprietário
                      displayData.owner, // Nome do proprietário
                      true // isDirectMessage = true (mensagem direta ao haras)
                    );
                    
                    if (conversationId) {
                      window.location.href = `/dashboard/messages?conversation=${conversationId}`;
                    }
                  } catch (error) {
                    console.error('Erro ao iniciar conversa:', error);
                    toast.error('Erro ao iniciar conversa. Tente novamente.');
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar Mensagem
              </Button>
            </Card>

            {/* Estatísticas */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Estatísticas</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">Total de Animais</span>
                  <span className="font-bold text-slate-900 text-lg">{garanhoes.length + doadoras.length + potros.length + potras.length + outros.length}</span>
                </div>
                
                {garanhoes.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 text-sm">Garanhões</span>
                    <span className="font-semibold text-blue-600">{garanhoes.length}</span>
                  </div>
                )}
                
                {doadoras.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 text-sm">Doadoras</span>
                    <span className="font-semibold text-pink-600">{doadoras.length}</span>
                  </div>
                )}
                
                {potros.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 text-sm">Potros</span>
                    <span className="font-semibold text-green-600">{potros.length}</span>
                  </div>
                )}
                
                {potras.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 text-sm">Potras</span>
                    <span className="font-semibold text-purple-600">{potras.length}</span>
                  </div>
                )}
                
                {outros.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 text-sm">Outros</span>
                    <span className="font-semibold text-slate-600">{outros.length}</span>
                  </div>
                )}
                
                {displayData.foundedYear && displayData.foundedYear !== 'N/A' && (
                  <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200">
                    <span className="text-slate-600 text-sm">Anos de Tradição</span>
                    <span className="font-bold text-blue-600 text-lg">{new Date().getFullYear() - Number(displayData.foundedYear)}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Raças Criadas */}
            {(garanhoes.length + doadoras.length + potros.length + potras.length + outros.length) > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Raças Criadas</h3>
                <div className="space-y-3">
                  {Array.from(new Set([...garanhoes, ...doadoras, ...potros, ...potras, ...outros].map(a => a.breed))).filter(breed => breed).map(breed => {
                    const allAnimals = [...garanhoes, ...doadoras, ...potros, ...potras, ...outros];
                    const count = allAnimals.filter(a => a.breed === breed).length;
                    const percentage = (count / allAnimals.length) * 100;
                    
                    return (
                      <div key={breed} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-900 text-sm">{breed}</span>
                          <span className="text-slate-600 font-semibold text-sm">{count}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
        <HarasEventsSection organizerId={id} />
      </div>
    </main>
  );
};

export default HarasPage;