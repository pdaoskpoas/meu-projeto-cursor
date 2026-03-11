import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Trophy, Crown, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { analyticsService } from '@/services/analyticsService';
import mangalargaImg from '@/assets/mangalarga.jpg';
import thoroughbredImg from '@/assets/thoroughbred.jpg';
import quarterHorseImg from '@/assets/quarter-horse.jpg';
import { formatNameUppercase } from '@/utils/nameFormat';
import { getAge } from '@/utils/animalAge';

interface Animal {
  id: string;
  name: string;
  breed: string;
  birthDate: string;
  gender: 'Macho' | 'Fêmea';
  currentLocation: {
    city: string;
    state: string;
  };
  chip?: string;
  titles: string[];
  image: string;
  images?: string[];
  harasId: string;
  harasName: string;
  ownerPropertyType?: string | null;
  views: number;
  featured: boolean;
  fatherName?: string | null;
  motherName?: string | null;
}

interface AnimalRankingCardProps {
  animal: Animal;
  index: number;
  isBoosted: boolean;
}

const AnimalRankingCard: React.FC<AnimalRankingCardProps> = ({ animal, index, isBoosted }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const cardRef = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);

  // 📊 Tracking de impressão quando card entra no viewport (50% visível)
  useEffect(() => {
    if (!cardRef.current || hasTracked.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            // Registrar impressão usando o MESMO serviço do AnimalCard
            analyticsService.recordImpression('animal', animal.id, user?.id, {
              pageUrl: window.location.href,
              carouselName: 'ranking_list',
              carouselPosition: index
            });
            hasTracked.current = true;
            // Parar de observar após registrar
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.5 // 50% do card visível
      }
    );

    observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, [animal.id, user?.id, index]);

  const getImageSrc = (imageName: string) => {
    switch (imageName) {
      case 'mangalarga': return mangalargaImg;
      case 'thoroughbred': return thoroughbredImg;
      case 'quarter-horse': return quarterHorseImg;
      default: return mangalargaImg;
    }
  };

  const heroImage = animal.images && animal.images.length > 0
    ? animal.images[0]
    : getImageSrc(animal.image);
  const displayAnimalName = formatNameUppercase(animal.name);
  const displayHarasName = formatNameUppercase(animal.harasName);
  const displayFatherName = formatNameUppercase(animal.fatherName || 'Não informado');
  const displayMotherName = formatNameUppercase(animal.motherName || 'Não informado');
  const ownerLabel = (() => {
    switch (animal.ownerPropertyType) {
      case 'fazenda':
        return 'Fazenda';
      case 'cte':
        return 'CTE';
      case 'central-reproducao':
        return 'Central';
      case 'haras':
        return 'Haras';
      default:
        return 'Haras';
    }
  })();

  // 📊 Handler para clique no card (tracking integrado)
  const handleCardClick = () => {
    // Registrar clique usando o MESMO serviço do AnimalCard
    analyticsService.recordClick('animal', animal.id, user?.id, {
      clickTarget: 'ranking_card',
      pageUrl: window.location.href
    });
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Registrar clique no botão de favoritar
    analyticsService.recordClick('animal', animal.id, user?.id, {
      clickTarget: 'favorite_button',
      pageUrl: window.location.href
    });
    
    if (user) {
      await toggleFavorite(animal.id);
    } else {
      navigate('/login');
    }
  };

  const isVerified = false;

  return (
    <Link to={`/animal/${animal.id}`} className="h-full" onClick={handleCardClick}>
      <Card 
        ref={cardRef}
        className="group hover:shadow-2xl transition-all duration-500 border-slate-200 bg-white overflow-hidden relative flex flex-col h-full"
      >
        {/* Boost Badge */}
        {isBoosted && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-yellow-500 text-white flex items-center gap-1 px-2 py-1">
              <Zap className="h-3 w-3" />
              <span className="hidden sm:inline">Turbinado</span>
            </Badge>
          </div>
        )}

        <div className="relative flex-shrink-0">
          <img 
            src={heroImage} 
            alt={displayAnimalName}
            className="w-full h-48 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Bottom Info Overlay */}
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <div className="flex items-center gap-2">
              {isVerified && (
                <div className="bg-blue-500 rounded-full p-1">
                  <Crown className="h-3 w-3 text-white" />
                </div>
              )}
              {animal.titles.length > 0 && (
                <div className="bg-yellow-500 rounded-full p-1">
                  <Trophy className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute bottom-3 right-3 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white shadow-lg"
            onClick={handleFavoriteClick}
          >
            <Heart
              className={`h-4 w-4 ${
                isFavorite(animal.id)
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-600 hover:text-red-500'
              }`}
            />
          </Button>
        </div>

        <div className="p-4 sm:p-6 flex flex-col flex-grow">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                {displayAnimalName}
              </h3>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {animal.breed}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {animal.gender}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {getAge(animal.birthDate)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Haras Info */}
          <div className="flex items-center justify-between text-sm mb-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-600">{ownerLabel}:</span>
              <span className="font-medium text-slate-900 truncate">{displayHarasName}</span>
              {isVerified && (
                <Crown className="h-3 w-3 text-blue-500" />
              )}
            </div>
          </div>

          {/* Genealogia resumida */}
          <div className="mt-auto pt-3 border-t border-slate-100 min-h-[76px] text-left">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-slate-700">Genealogia</span>
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">PAI:</span> {displayFatherName}
            </div>
            <div className="text-xs text-slate-400">x</div>
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">MÃE:</span> {displayMotherName}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-slate-600 mt-3">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{animal.currentLocation.city}, {animal.currentLocation.state}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default AnimalRankingCard;

