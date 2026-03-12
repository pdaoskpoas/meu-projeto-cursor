import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import PhotoGallery from '@/components/PhotoGallery';
import { formatNameUppercase } from '@/utils/nameFormat';
import { getPlaceholderGallery } from '@/utils/animalCard';

interface RankingHistoryCardProps {
  animalId: string;
  animalName: string;
  animalImages: string[];
  category: 'Garanhão' | 'Doadora' | 'Potro' | 'Potra';
  monthName: string;
  year: number;
  adStatus: string;
}

const RankingHistoryCard: React.FC<RankingHistoryCardProps> = ({
  animalId,
  animalName,
  animalImages,
  category,
  monthName,
  year,
  adStatus
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const isActive = adStatus === 'active';
  const displayName = formatNameUppercase(animalName);
  const images = animalImages.length > 0 ? animalImages : getPlaceholderGallery();

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'Garanhão':
        return 'Garanhão mais buscado';
      case 'Doadora':
        return 'Doadora mais buscada';
      case 'Potro':
        return 'Potro mais buscado';
      case 'Potra':
        return 'Potra mais buscada';
      default:
        return 'Animal mais visualizado';
    }
  };

  const handleCardClick = () => {
    if (isActive) {
      navigate(`/animal/${animalId}`);
    } else {
      toast({
        title: 'Anúncio não disponível',
        description: 'O anúncio deste animal está pausado ou não está mais disponível.',
        variant: 'default'
      });
    }
  };

  return (
    <Card
      onClick={handleCardClick}
      className={`overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer ${
        isActive ? 'hover:scale-[1.02]' : 'opacity-90'
      }`}
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        <PhotoGallery
          images={images}
          alt={displayName}
          className="w-full h-48 sm:h-64 object-cover"
        />

        {/* Badge de status se não estiver ativo */}
        {!isActive && (
          <div className="absolute bottom-2 right-2 z-10">
            <Badge variant="secondary" className="text-xs">
              {adStatus === 'paused' ? 'Pausado' : 'Indisponível'}
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-bold text-lg text-slate-900 line-clamp-1">
          {displayName}
        </h3>
        
        <p className="text-sm text-slate-600">
          {getCategoryLabel(category)} em {monthName} de {year}
        </p>
      </div>
    </Card>
  );
};

export default RankingHistoryCard;
