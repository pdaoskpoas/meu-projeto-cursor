import React from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/ui/BackButton';
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
  getEventIcon
}) => {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between gap-4">
          <BackButton fallbackPath="/eventos" label="Voltar" variant="ghost" className="text-slate-700 hover:bg-slate-100" />
          <Button
            variant="ghost"
            onClick={onShare}
            className="text-slate-700 hover:bg-slate-100"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="text-3xl sm:text-4xl">{getEventIcon(event.event_type)}</div>
          <div>
            <p className="text-sm text-slate-500">Evento</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {event.title}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsHero;
