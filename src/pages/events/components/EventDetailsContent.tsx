import React from 'react';
import { Calendar, MapPin, Users, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EventDetailsEvent } from '../types';
import EventReportDialog from '@/components/events/EventReportDialog';

interface EventDetailsContentProps {
  event: EventDetailsEvent;
  formatDate: (dateString: string) => string;
  getEventIcon: (type: string | null) => string;
  onShare: () => void;
}

const EventDetailsContent: React.FC<EventDetailsContentProps> = ({
  event,
  formatDate,
  getEventIcon,
  onShare
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-4 sm:p-6 bg-slate-50">
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full max-h-[380px] object-contain rounded-lg"
            />
          ) : (
            <div className="w-full h-[260px] sm:h-[320px] flex items-center justify-center rounded-lg bg-white border border-slate-200">
              <span className="text-6xl">{getEventIcon(event.event_type)}</span>
            </div>
          )}
        </Card>

        <Card className="p-6 sm:p-8">
          <div className="mb-6">
            {event.event_type && (
              <Badge variant="secondary" className="mb-3">
                {getEventIcon(event.event_type)} {event.event_type}
              </Badge>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              {event.title}
            </h1>
            {(event.organizer_property || event.organizer_name) && (
              <p className="text-base sm:text-lg text-gray-600">
                Publicado por:{' '}
                {event.organizer_public_code || event.organizer_id ? (
                  <Link
                    to={event.organizer_public_code ? `/profile/${event.organizer_public_code}` : `/haras/${event.organizer_id}`}
                    className="font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {event.organizer_property || event.organizer_name}
                  </Link>
                ) : (
                  <span className="font-semibold">
                    {event.organizer_property || event.organizer_name}
                  </span>
                )}
              </p>
            )}
            {event.promotora && (
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-semibold">Promotora:</span> {event.promotora}
              </p>
            )}
            {event.organizadora && (
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-semibold">Organizadora:</span> {event.organizadora}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Data de Início</p>
                <p className="text-gray-900 font-semibold">
                  {formatDate(event.start_date)}
                </p>
              </div>
            </div>

            {event.end_date && (
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Data de Término</p>
                  <p className="text-gray-900 font-semibold">
                    {formatDate(event.end_date)}
                  </p>
                </div>
              </div>
            )}

            {(event.city || event.state) && (
              <div className="flex items-start gap-3">
                <div className="bg-red-100 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Localização</p>
                  <p className="text-gray-900 font-semibold">
                    {event.city}
                    {event.city && event.state && ', '}
                    {event.state}
                  </p>
                  {event.location && (
                    <p className="text-sm text-gray-600">{event.location}</p>
                  )}
                </div>
              </div>
            )}

            {event.registration_deadline && (
              <div className="flex items-start gap-3">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Prazo para Inscrição</p>
                  <p className="text-gray-900 font-semibold">
                    {formatDate(event.registration_deadline)}
                  </p>
                </div>
              </div>
            )}

            {event.max_participants && (
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Limite de Participantes</p>
                  <p className="text-gray-900 font-semibold">
                    {event.max_participants} pessoas
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {event.description && (
          <Card className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Sobre o Evento
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {event.description}
            </p>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Divulgação Profissional
          </h3>
          <p className="text-gray-600 mb-4">
            Compartilhe este evento com seu público e potencialize a audiência.
          </p>
          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={onShare}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Compartilhar link
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Contato
          </h3>
          {(event.contact_name || event.contact_phone || event.contact_email || event.organizer_email) ? (
            <div className="space-y-2">
              {event.contact_name && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Contato:</span> {event.contact_name}
                </p>
              )}
              {event.contact_phone && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Telefone:</span> {event.contact_phone}
                </p>
              )}
              {(event.contact_email || event.organizer_email) && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Email:</span>{' '}
                  <a
                    href={`mailto:${event.contact_email || event.organizer_email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {event.contact_email || event.organizer_email}
                  </a>
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Contato não informado.
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Denunciar evento
          </h3>
          <p className="text-gray-600 mb-4">
            Ajude a manter a plataforma segura sinalizando irregularidades.
          </p>
          <EventReportDialog
            eventId={event.id}
            eventTitle={event.title}
            organizerId={event.organizer_id}
            organizerName={event.organizer_property || event.organizer_name}
          />
        </Card>

      </div>
    </div>
  );
};

export default EventDetailsContent;
