import React, { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eye, Edit3, Trash2, MapPin, Users, Camera } from 'lucide-react';
import { analyticsService } from '@/services/analyticsService';
import { useAuth } from '@/contexts/AuthContext';
import PhotoGallery from '@/components/PhotoGallery';
import { formatNameUppercase } from '@/utils/nameFormat';
import type { Animal } from '@/types/animal';

interface AnimalCardProps {
  animal: Animal;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  hasPartnership?: boolean;
}

export const AnimalCard: React.FC<AnimalCardProps> = ({
  animal,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  hasPartnership = false
}) => {
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);

  // 📊 Tracking de impressão quando card entra no viewport (50% visível)
  useEffect(() => {
    if (!cardRef.current || hasTracked.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            // Registrar impressão
            analyticsService.recordImpression('animal', animal.id, user?.id, {
              pageUrl: window.location.href
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
  }, [animal.id, user?.id]);

  // 📊 Handler para clique no card completo
  const handleCardClick = () => {
    analyticsService.recordClick('animal', animal.id, user?.id, {
      clickTarget: 'animal_card',
      pageUrl: window.location.href
    });
    
    if (onView) {
      onView(animal.id);
    }
  };

  // 📊 Handler para clique no botão de editar
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Previne propagação para o card
    analyticsService.recordClick('animal', animal.id, user?.id, {
      clickTarget: 'edit_button',
      pageUrl: window.location.href
    });
    
    if (onEdit) {
      onEdit(animal.id);
    }
  };

  // 📊 Handler para clique no botão de deletar
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Previne propagação para o card
    analyticsService.recordClick('animal', animal.id, user?.id, {
      clickTarget: 'delete_button',
      pageUrl: window.location.href
    });
    
    if (onDelete) {
      onDelete(animal.id);
    }
  };
  const getGenderIcon = (gender: string) => {
    return gender === 'Macho' ? '♂' : '♀';
  };

  const getGenderColor = (gender: string) => {
    return gender === 'Macho' ? 'text-blue-600' : 'text-pink-600';
  };

  // Obter imagens do animal
  const getAnimalImages = () => {
    // Se o animal tem imagens do banco de dados, usar essas
    if (animal.images && Array.isArray(animal.images) && animal.images.length > 0) {
      return animal.images;
    }
    // Retornar null quando não há imagens (não usar fallback padrão)
    return null;
  };

  const animalImages = getAnimalImages();

  const displayName = formatNameUppercase(animal.name);

  return (
    <Card 
      ref={cardRef}
      onClick={handleCardClick}
      className="card-professional overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        {animalImages ? (
          <PhotoGallery
            images={animalImages}
            alt={displayName}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
            <Camera className="h-16 w-16 mb-2 opacity-50" />
            <p className="text-sm font-medium">Sem fotos</p>
            <p className="text-xs">Clique para ver detalhes</p>
          </div>
        )}
        
        {hasPartnership && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-blue-600 text-white flex items-center gap-1">
              <Users className="h-3 w-3" />
              Sociedade
            </Badge>
          </div>
        )}
        
        {/* Indicador de gênero sobreposto */}
        <div className="absolute bottom-2 left-2">
          <Badge className={`${getGenderColor(animal.gender)} bg-white/90 backdrop-blur-sm`}>
            <span className="font-bold">{getGenderIcon(animal.gender)}</span>
            <span className="ml-1">{animal.gender}</span>
          </Badge>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-blue-dark">{displayName}</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-medium">
            <span>{animal.breed}</span>
            <span>•</span>
            <span className={getGenderColor(animal.gender)}>{animal.gender}</span>
            <span>•</span>
            <span>{animal.coat}</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-medium mt-1">
            <MapPin className="h-3 w-3" />
            <span>{animal.currentLocation.city}, {animal.currentLocation.state}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {animal.coat}
          </Badge>
          {animal.titles?.map((title, index) => (
            <Badge key={index} className="bg-accent/10 text-accent border-accent/20 text-xs">
              {title}
            </Badge>
          ))}
        </div>
        
        {showActions && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="text-xs text-gray-medium">
              Localização: {animal.currentLocation.city}/{animal.currentLocation.state}
            </div>
            
            <div className="flex space-x-1">
              {onView && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={handleCardClick}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {onEdit && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={handleEditClick}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};