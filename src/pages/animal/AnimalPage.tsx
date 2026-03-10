import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Eye, Award, Calendar, MapPin, Crown, Share2, Heart, Flag, Users } from 'lucide-react';
import { formatNameUppercase } from '@/utils/nameFormat';
import { normalizeSupabaseImages } from '@/utils/animalCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import AnimalPhotoGallery from '@/components/animal/AnimalPhotoGallery';
import ReportDialog from '@/components/ReportDialog';
import ChatModal from '@/components/chat/ChatModal';
import SendMessageButton from '@/components/SendMessageButton';
import { animalService } from '@/services/animalService';
import { partnershipService } from '@/services/partnershipService';
import { animalTitlesService } from '@/services/animalTitlesService';
import { useViewPermissions } from '@/hooks/useViewPermissions';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService } from '@/services/analyticsService';
import { useFavorites } from '@/contexts/FavoritesContext';
import PedigreeChart from '@/components/PedigreeChart';
import mangalargaImg from '@/assets/mangalarga.jpg';
import thoroughbredImg from '@/assets/thoroughbred.jpg';
import quarterHorseImg from '@/assets/quarter-horse.jpg';

const getAge = (birthDate: string) => {
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 'N/A';
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return `${Math.max(age, 0)} anos`;
};

const AnimalPage = () => {
  const { id } = useParams();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showChatModal, setShowChatModal] = useState(false);
  const { canViewAnimalViews } = useViewPermissions();
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  
  interface AnimalData {
    id: string;
    name: string;
    breed?: string;
    gender?: string;
    images?: string[];
    harasId?: string;
    [key: string]: unknown;
  }
  
  const [horseDb, setHorseDb] = useState<AnimalData | null>(null);
  const [partners, setPartners] = useState([]);
  const [isOwnerOrPartner, setIsOwnerOrPartner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const horse = horseDb;
  const haras = horse
    ? {
        id: horse.harasId,
        name: horse.harasName,
        location: `${horse.currentLocation.city}, ${horse.currentLocation.state}`,
        verified: false,
      }
    : null;
  const displayHorseName = formatNameUppercase(horse?.name);
  const displayHarasName = formatNameUppercase(haras?.name);
  const displayOwnerName = horse?.ownerAccountType === 'institutional'
    ? formatNameUppercase(horse?.ownerName || horse?.harasName)
    : (horse?.ownerName || horse?.harasName || '');
  
  // Ler animal do Supabase
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) {
        console.log('[AnimalPage] ID não fornecido');
        setIsLoading(false);
        return;
      }
      
      console.log('[AnimalPage] Buscando animal com ID:', id);
      setIsLoading(true);
      
      try {
        const a = await animalService.getAnimalById(id);
        
        if (!mounted) {
          console.log('[AnimalPage] Componente desmontado, abortando');
          return;
        }
        
        if (!a) {
          console.log('[AnimalPage] Animal não encontrado ou sem permissão para visualizar');
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }
        
        console.log('[AnimalPage] Animal carregado com sucesso:', {
          id: a.id,
          name: a.name,
          ad_status: a.ad_status,
          images_count: a.images?.length || 0
        });
        
        // Determinar nome correto do proprietário baseado no tipo de conta
        const ownerAccountType = a.owner_account_type ?? 'personal';
        const ownerDisplayName = ownerAccountType === 'institutional' 
          ? (a.owner_property_name || a.owner_name || '—')
          : (a.owner_name || '—');

        setHorseDb({
          id: a.id,
          name: a.name,
          breed: a.breed,
          gender: a.gender,
          birthDate: a.birth_date ?? '2000-01-01',
          coat: a.coat ?? '—',
          currentLocation: { city: a.current_city ?? '—', state: a.current_state ?? '—' },
          chip: a.registration_number ?? null,
          harasId: a.haras_id ?? a.owner_id ?? '0',
          harasName: a.haras_name ?? '—',
          ownerId: a.owner_id,
          ownerName: ownerDisplayName,
          ownerPersonalName: a.owner_name ?? null,
          ownerPropertyName: a.owner_property_name ?? null,
          ownerPublicCode: a.owner_public_code ?? null,
          ownerAccountType: ownerAccountType,
          category: a.category ?? null,
          description: a.description ?? null,
          father: a.father_name ?? null,
          mother: a.mother_name ?? null,
          paternalGrandfather: a.paternal_grandfather_name ?? null,
          paternalGrandmother: a.paternal_grandmother_name ?? null,
          maternalGrandfather: a.maternal_grandfather_name ?? null,
          maternalGrandmother: a.maternal_grandmother_name ?? null,
          titles: Array.isArray(a.titles) ? a.titles : [],
          image: 'mangalarga',
          images: normalizeSupabaseImages(a as Record<string, unknown>),
          views: a.impression_count ?? 0,
          featured: a.is_boosted ?? false,
          publishedDate: a.published_at ?? new Date().toISOString(),
          allowMessages: a.allow_messages ?? true,
          adStatus: a.ad_status ?? 'active',
          expiresAt: a.expires_at ?? undefined,
          canEdit: a.can_edit ?? true
        });

        // Buscar títulos/premiações
        const titlesData = await animalTitlesService.getTitles(a.id);
        if (mounted && titlesData.length > 0) {
          const mappedTitles = titlesData
            .map((title) => {
              const award = title.award?.trim();
              const eventName = title.event_name?.trim();
              if (award && eventName) return `${award} • ${eventName}`;
              return award || eventName || '';
            })
            .filter(Boolean);
          setHorseDb((prev) => prev ? { ...prev, titles: mappedTitles } : prev);
        }

        // Buscar sócios do animal
        const animalPartners = await partnershipService.getAnimalPartners(id);
        if (mounted) {
          setPartners(animalPartners || []);
          
          // Verificar se usuário logado é dono ou sócio
          if (user?.id) {
            const isOwner = a.owner_id === user.id;
            const isPartner = animalPartners.some(p => p.partner_id === user.id);
            setIsOwnerOrPartner(isOwner || isPartner);
          }
          
          setIsLoading(false);
        }
      } catch (error: unknown) {
        console.error('[AnimalPage] Erro ao carregar animal:', {
          id,
          error: error?.message || error,
          code: error?.code,
          details: error?.details
        });
        
        if (mounted) {
          setHorseDb(null);
          setPartners([]);
          setIsLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, [id, user?.id]);
  const canSeeViews = horse ? canViewAnimalViews(horse) : false;
  
  // Stats para exibição
  const stats = {
    impressions: horse?.views || 0,
    clicks: Math.floor((horse?.views || 0) * 0.15), // Simulação de 15% de taxa de clique
    clickRate: horse?.views ? Math.floor((horse?.views || 0) * 0.15) / (horse?.views || 1) * 100 : 0
  };

  // Handlers de analytics para cliques relevantes
  const handleFavoriteClick = async () => {
    if (horse) {
      analyticsService.recordClick('animal', horse.id, user?.id, { clickTarget: 'favorite' });
      await toggleFavorite(horse.id);
    }
  };
  
  // Registrar impressão do detalhe quando a página carregar
  useEffect(() => {
    if (horse && id) {
      analyticsService.recordImpression('animal', id, user?.id);
    }
  }, [horse, id, user?.id]);

  const getImageSrc = (imageName: string) => {
    switch (imageName) {
      case 'mangalarga': return mangalargaImg;
      case 'thoroughbred': return thoroughbredImg;
      case 'quarter-horse': return quarterHorseImg;
      default: return mangalargaImg;
    }
  };

  const fallbackPhotos = horse
    ? [
        getImageSrc(horse.image),
        getImageSrc(horse.image),
        getImageSrc(horse.image),
        getImageSrc(horse.image)
      ]
    : [];

  const horseImages = horse ? normalizeSupabaseImages(horse as Record<string, unknown>) : [];
  const animalPhotos = horseImages.length > 0 ? horseImages : fallbackPhotos;

  useEffect(() => {
    if (!horse) return;
    analyticsService.recordImpression('animal', horse.id, user?.id, {
      carouselName: 'animal_photos',
      carouselPosition: currentPhotoIndex,
    });
  }, [horse, user?.id, currentPhotoIndex]);

  // Estado de carregamento
  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-12 min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Carregando animal...</p>
        </div>
      </main>
    );
  }

  // Animal não encontrado (após carregar)
  if (!horse) {
    return (
      <main className="container mx-auto px-4 py-12 min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900">Animal não encontrado</h1>
          <p className="text-gray-600">O animal solicitado não foi encontrado em nossa base de dados.</p>
          <Link to="/">
            <Button>Voltar ao Início</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 min-h-screen bg-background">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="font-medium">Voltar</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo Gallery */}
          <Card className="overflow-hidden p-4">
            <AnimalPhotoGallery
              images={animalPhotos}
              alt={displayHorseName}
              onIndexChange={setCurrentPhotoIndex}
            />
          </Card>

          {/* Animal Info */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{displayHorseName}</h1>
                  {haras?.verified && (
                    <div className="bg-blue-500 rounded-full p-2">
                      <Crown className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="text-sm">
                    {horse.breed}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {horse.gender}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {getAge(horse.birthDate)}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {horse.coat}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFavoriteClick}
                  className="flex items-center gap-2"
                >
                  <Heart 
                    className={`h-4 w-4 ${
                      isFavorite(horse.id) 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-gray-600'
                    }`} 
                  />
                  {isFavorite(horse.id) ? 'Favoritado' : 'Favoritar'}
                </Button>
                
                <ReportDialog animalId={horse.id} animalName={displayHorseName}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => analyticsService.recordClick('animal', horse.id, user?.id, { clickTarget: 'report' })}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Reportar
                  </Button>
                </ReportDialog>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Nascimento:</span>
                  <span className="font-medium">{new Date(horse.birthDate).toLocaleDateString('pt-BR')}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Localização:</span>
                  <span className="font-medium">{horse.currentLocation.city}, {horse.currentLocation.state}</span>
                </div>

                {canSeeViews && (
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Visualizações:</span>
                    <span className="font-medium">{stats.impressions}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {/* Link para perfil do proprietário */}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Proprietário:</span>
                  {horse.ownerPublicCode ? (
                    <Link 
                      to={`/profile/${horse.ownerPublicCode}`}
                      onClick={() => analyticsService.recordClick('animal', horse.id, user?.id, { clickTarget: 'owner_link' })}
                      className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {horse.ownerName}
                    </Link>
                  ) : (
                    <span className="font-medium">{horse.ownerName}</span>
                  )}
                </div>

                {horse.category && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Categoria:</span>
                    <span className="font-medium capitalize">{horse.category}</span>
                  </div>
                )}

                {horse.chip && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Registro:</span>
                    <span className="font-medium">{horse.chip}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Titles */}
            {horse.titles.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Títulos e Premiações
                </h3>
                <div className="flex flex-wrap gap-2">
                  {horse.titles.map((title, index) => (
                    <Badge key={index} variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Descrição */}
            {horse.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Sobre o Animal</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{horse.description}</p>
              </div>
            )}
          </Card>

          {/* Genealogia */}
          {(horse.father || horse.mother || horse.paternalGrandfather || horse.paternalGrandmother || horse.maternalGrandfather || horse.maternalGrandmother) && (
            <PedigreeChart horse={horse} />
          )}

        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact */}
          {horse.allowMessages && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Interessado?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Entre em contato com o proprietário para mais informações.
              </p>
              <SendMessageButton
                animal={horse}
                onClick={() => analyticsService.recordClick('animal', horse.id, user?.id, { clickTarget: 'send_message' })}
              />
            </Card>
          )}

          {/* Quadro Societário */}
          {partners.length > 0 && (
            <Card className="p-6 border-2 border-blue-100 bg-blue-50/40">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Quadro Societário</h3>
                <Badge variant="secondary" className="ml-auto">
                  {partners.length} {partners.length === 1 ? 'Sócio' : 'Sócios'}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {partners.map((partner) => (
                  <div 
                    key={partner.partner_id}
                    className="flex items-center justify-between p-3 bg-white/70 rounded-lg hover:bg-white transition-colors"
                  >
                    <Link 
                      to={`/profile/${partner.partner_public_code}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                        {partner.avatar_url ? (
                          <img
                            src={partner.avatar_url}
                            alt={partner.partner_property_name || partner.partner_name || 'Sócio'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{partner.partner_name?.charAt(0).toUpperCase() || 'S'}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {partner.partner_property_name || partner.partner_name}
                        </p>
                        {partner.partner_property_name && partner.partner_name && partner.partner_property_name !== partner.partner_name && (
                          <p className="text-sm text-gray-600 truncate">
                            {partner.partner_name}
                          </p>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-gray-500 mt-3 text-center italic">
                Animal em regime de sociedade
              </p>
            </Card>
          )}

          {/* Stats */}
          {canSeeViews && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Estatísticas</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Visualizações:</span>
                  <span className="font-medium">{stats.impressions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cliques:</span>
                  <span className="font-medium">{stats.clicks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de clique:</span>
                  <span className="font-medium">{stats.clickRate.toFixed(1)}%</span>
                </div>
              </div>
            </Card>
          )}

          {/* Haras Info */}
          {haras && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Sobre o Haras</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{displayHarasName}</span>
                  {haras.verified && <Crown className="h-4 w-4 text-blue-500" />}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{haras.location}</span>
                </div>
                <Link 
                  to={`/haras/${haras.id}`}
                  onClick={() => analyticsService.recordClick('animal', horse.id, user?.id, { clickTarget: 'haras_link' })}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Ver perfil completo
                  <ArrowLeft className="h-3 w-3 rotate-180" />
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        animalId={horse.id}
        animalName={displayHorseName}
        animalOwnerId={horse.harasId}
        animalOwnerName={displayOwnerName}
      />
    </main>
  );
};

export default AnimalPage;
