import React from 'react';
import { Share2, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EventDetailsEvent } from '../types';

interface EventDetailsHeroProps {
  event: EventDetailsEvent;
  onBack?: () => void;
  onShare: () => void;
  getEventIcon: (type: string | null) => string;
}

const EventDetailsHero: React.FC<EventDetailsHeroProps> = ({
  event,
  onShare,
}) => {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="container mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
        {/* Mobile: botão compacto "← Eventos" */}
        <Link
          to="/eventos"
          className="sm:hidden inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Eventos
        </Link>

        {/* Desktop: breadcrumb completo */}
        <nav
          aria-label="Breadcrumb"
          className="hidden sm:flex items-center gap-2 text-sm min-w-0"
        >
          <Link
            to="/"
            className="text-slate-500 hover:text-slate-900 transition-colors"
          >
            Início
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
          <Link
            to="/eventos"
            className="text-slate-500 hover:text-slate-900 transition-colors"
          >
            Eventos
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-900 font-medium truncate">
            {event.title}
          </span>
        </nav>

        <Button
          variant="ghost"
          size="sm"
          onClick={onShare}
          className="text-slate-700 hover:bg-slate-100 shrink-0 -mr-2"
        >
          <Share2 className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Compartilhar</span>
        </Button>
      </div>
    </div>
  );
};

export default EventDetailsHero;
