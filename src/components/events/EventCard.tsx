import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Eye, MousePointerClick } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { analyticsService } from '@/services/analyticsService';
import { useAuth } from '@/contexts/AuthContext';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    event_type: string | null;
    description: string | null;
    start_date: string;
    end_date: string | null;
    city: string | null;
    state: string | null;
    location: string | null;
    cover_image_url: string | null;
    max_participants: number | null;
    organizer_property?: string;
    organizer_id?: string | null;
    organizer_name?: string | null;
    organizer_public_code?: string | null;
    is_boosted?: boolean;
    impressions?: number;
    clicks?: number;
  };
  status?: 'active' | 'ended';
  showStats?: boolean; // Exibir estatísticas (apenas para admin)
}

const EventCard: React.FC<EventCardProps> = ({ event, status = 'active', showStats = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);
  const isEnded = status === 'ended';

  // Registrar impressão quando o card entrar no viewport
  useEffect(() => {
    if (!cardRef.current || hasTracked.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            // Registrar impressão
            analyticsService.recordImpression('event', event.id, user?.id, {
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
  }, [event.id, user?.id]);

  // Handler de clique - registra clique e navega
  const handleClick = () => {
    analyticsService.recordClick('event', event.id, user?.id, {
      clickTarget: 'event_card',
      pageUrl: window.location.href
    });
    navigate(`/eventos/${event.id}`);
  };

  // Formatar data
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data a confirmar';
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Data a confirmar';
    }
  };

  // Ícone do tipo de evento
  const getEventIcon = (type: string | null) => {
    switch (type) {
      case 'Competição': return '';
      case 'Leilão': return '';
      case 'Exposição': return '';
      case 'Copa': return '';
      case 'Curso': return '';
      case 'Encontro': return '';
      default: return '';
    }
  };

  return (
    <Card
      ref={cardRef}
      onClick={handleClick}
      className={`group cursor-pointer transition-all duration-500 overflow-hidden relative flex flex-col h-full border-slate-200 ${
        isEnded
          ? 'bg-slate-50 hover:shadow-md'
          : 'bg-white hover:shadow-2xl'
      }`}
    >
      {/* Imagem de Capa */}
      <div className="relative h-48 sm:h-56 bg-white overflow-hidden">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.title}
            className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ${
              isEnded ? 'grayscale opacity-80' : ''
            }`}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-6xl ${isEnded ? 'opacity-60' : ''}`}>
            {getEventIcon(event.event_type)}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3">
          <Badge
            className={
              isEnded
                ? 'bg-slate-600 text-white'
                : 'bg-blue-100 text-blue-800'
            }
          >
            {isEnded ? 'Encerrado' : 'Ativo'}
          </Badge>
        </div>
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          {event.is_boosted && (
            <Badge className="bg-blue-500 text-white">
              Em Destaque
            </Badge>
          )}
          {event.event_type && (
            <Badge variant="secondary" className="bg-white/90">
              {event.event_type}
            </Badge>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 sm:p-6 space-y-3 flex flex-col flex-grow">
        {/* Título */}
        <h3 className={`font-bold text-lg line-clamp-2 transition-colors ${
          isEnded ? 'text-slate-700' : 'text-gray-900 group-hover:text-blue-600'
        }`}>
          {event.title}
        </h3>

        {/* Descrição */}
        {event.description && (
          <p className={`text-sm line-clamp-2 ${isEnded ? 'text-slate-500' : 'text-gray-600'}`}>
            {event.description}
          </p>
        )}

        {/* Informações */}
        <div className="space-y-2">
          {/* Data */}
          <div className={`flex items-center gap-2 text-sm ${isEnded ? 'text-slate-600' : 'text-gray-700'}`}>
            <Calendar className={`h-4 w-4 ${isEnded ? 'text-slate-500' : 'text-blue-600'}`} />
            <span>
              {formatDate(event.start_date)}
              {event.end_date && ` - ${formatDate(event.end_date)}`}
            </span>
          </div>

          {/* Local */}
          {(event.city || event.state) && (
            <div className={`flex items-center gap-2 text-sm ${isEnded ? 'text-slate-600' : 'text-gray-700'}`}>
              <MapPin className={`h-4 w-4 ${isEnded ? 'text-slate-500' : 'text-blue-600'}`} />
              <span>
                {event.city}
                {event.city && event.state && ', '}
                {event.state}
              </span>
            </div>
          )}

          {/* Limite de Participantes */}
          {event.max_participants && (
            <div className={`flex items-center gap-2 text-sm ${isEnded ? 'text-slate-600' : 'text-gray-700'}`}>
              <Users className={`h-4 w-4 ${isEnded ? 'text-slate-500' : 'text-blue-600'}`} />
              <span>Limite: {event.max_participants} participantes</span>
            </div>
          )}

          {/* Publicado por */}
          {(event.organizer_property || event.organizer_name) && (
            <div className={`flex items-center gap-2 text-sm ${isEnded ? 'text-slate-500' : 'text-gray-500'}`}>
              <span className="font-medium">Publicado por:</span>
              {event.organizer_public_code || event.organizer_id ? (
                <Link
                  to={event.organizer_public_code ? `/profile/${event.organizer_public_code}` : `/haras/${event.organizer_id}`}
                  onClick={(eventClick) => eventClick.stopPropagation()}
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  {event.organizer_property || event.organizer_name}
                </Link>
              ) : (
                <span className="font-semibold">
                  {event.organizer_property || event.organizer_name}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Estatísticas (apenas para admin) */}
        {showStats && (
          <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{event.impressions || 0} visualizações</span>
            </div>
            <div className="flex items-center gap-1">
              <MousePointerClick className="h-3 w-3" />
              <span>{event.clicks || 0} cliques</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default EventCard;


