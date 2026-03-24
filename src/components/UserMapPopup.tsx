import React from 'react';
import { X, MapPin, Instagram, ExternalLink, Crown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Profile } from '@/types/supabase';
import { formatNameUppercase } from '@/utils/nameFormat';

interface UserMapPopupProps {
  user: Profile;
  onClose: () => void;
  onViewProfile: (userId: string) => void;
}

const UserMapPopup: React.FC<UserMapPopupProps> = ({ user, onClose, onViewProfile }) => {
  const isVip = user.plan !== 'free';
  
  const isInstitutional = user.account_type === 'institutional';
  const displayPropertyName = isInstitutional ? formatNameUppercase(user.property_name) : user.property_name || '';
  const displayOwnerName = isInstitutional ? formatNameUppercase(user.name) : user.name;

  // Simular Instagram handle baseado no nome da propriedade
  const instagramHandle = user.property_name 
    ? `@${user.property_name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}`
    : `@${user.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="relative">
          {/* Background gradient */}
          <div className="h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"></div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Avatar */}
          <div className="absolute -bottom-8 left-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                {isVip && user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={displayOwnerName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<span class="text-white font-bold text-lg">${user.name.charAt(0).toUpperCase()}</span>`;
                      }
                    }}
                  />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* VIP Crown */}
              {isVip && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                  <Crown className="h-3 w-3 text-yellow-800" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-12 p-6 space-y-4">
          {/* Nome e Badge */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900">
                {displayPropertyName || displayOwnerName}
              </h3>
              {isVip && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                  <Star className="h-3 w-3 mr-1" />
                  VIP
                </Badge>
              )}
            </div>
            
            {user.property_name && (
              <p className="text-gray-600 text-sm">
                Proprietário: {displayOwnerName}
              </p>
            )}
          </div>

          {/* Tipo de Propriedade */}
          {user.property_type && (
            <div>
              <Badge variant="outline" className="capitalize">
                {user.property_type === 'haras' && 'Haras'}
                {user.property_type === 'fazenda' && '🌾 Fazenda'}
                {user.property_type === 'cte' && 'CTE'}
                {user.property_type === 'central-reproducao' && '🧬 Central de Reprodução'}
              </Badge>
            </div>
          )}

          {/* Localização */}
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">
              {user.city && user.state && user.country ? (
                `${user.city}, ${user.state}, ${user.country}`
              ) : user.city && user.country ? (
                `${user.city}, ${user.country}`
              ) : user.property_name ? (
                `${displayPropertyName}, Brasil`
              ) : (
                'Salvador, Brasil'
              )}
            </span>
          </div>

          {/* Instagram */}
          <div className="flex items-center gap-2 text-gray-600">
            <Instagram className="h-4 w-4" />
            <span className="text-sm">{instagramHandle}</span>
          </div>

          {/* Plano */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Plano:</span>
            <Badge 
              className={`capitalize ${
                isVip 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {user.plan}
            </Badge>
          </div>

          {/* Botão Ver Perfil Completo */}
          <Button
            onClick={() => onViewProfile(user.id)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Perfil Completo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserMapPopup;
