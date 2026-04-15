import React from 'react';
import { Calendar, MapPin, Users, Clock, ExternalLink, Flag, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EventDetailsEvent } from '../types';
import EventReportDialog from '@/components/events/EventReportDialog';
import { buildHarasUrl } from '@/utils/urls';

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
  const organizerDisplay = event.organizer_property || event.organizer_name;
  const organizerCanLink = !!(event.organizer_public_code || event.organizer_id);
  const hasContact =
    !!event.contact_name ||
    !!event.contact_phone ||
    !!event.contact_email ||
    !!event.organizer_email;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* ================== COLUNA PRINCIPAL ================== */}
      <div className="lg:col-span-2 space-y-6">
        {/* Cabeçalho do evento: categoria, título, organizador */}
        <Card className="p-6 sm:p-8 shadow-sm border-slate-200">
          <div className="space-y-4">
            {event.event_type && (
              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide"
              >
                {event.event_type}
              </Badge>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-[2.5rem] leading-tight font-bold text-slate-900">
              {event.title}
            </h1>

            {organizerDisplay && (
              <div className="flex items-center gap-2 pt-1 text-[15px]">
                <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-slate-500">Publicado por</span>
                {organizerCanLink ? (
                  <Link
                    to={buildHarasUrl({
                      id: event.organizer_id ?? null,
                      name: event.organizer_name ?? null,
                      property_name: event.organizer_property ?? null,
                      public_code: event.organizer_public_code ?? null,
                      account_type: event.organizer_property ? 'institutional' : 'personal',
                    })}
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:underline truncate"
                  >
                    {organizerDisplay}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-900 truncate">
                    {organizerDisplay}
                  </span>
                )}
              </div>
            )}

            {(event.promotora || event.organizadora) && (
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600 pt-1 border-t border-slate-100 mt-4">
                {event.promotora && (
                  <p>
                    <span className="font-semibold text-slate-700">Promotora:</span>{' '}
                    {event.promotora}
                  </p>
                )}
                {event.organizadora && (
                  <p>
                    <span className="font-semibold text-slate-700">Organizadora:</span>{' '}
                    {event.organizadora}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Capa do evento */}
        <Card className="overflow-hidden shadow-sm border-slate-200">
          {event.cover_image_url ? (
            <div className="bg-slate-100 flex items-center justify-center">
              <img
                src={event.cover_image_url}
                alt={event.title}
                className="w-full max-h-[560px] object-contain"
              />
            </div>
          ) : (
            <div className="aspect-[16/9] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <span className="text-7xl opacity-60">
                {getEventIcon(event.event_type)}
              </span>
            </div>
          )}
        </Card>

        {/* Informações principais — cards com ícones */}
        <Card className="p-6 sm:p-8 shadow-sm border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-5">
            Informações do Evento
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <InfoRow
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              icon={<Calendar className="h-5 w-5" />}
              label="Data de Início"
              value={formatDate(event.start_date)}
            />

            {event.end_date && (
              <InfoRow
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
                icon={<Calendar className="h-5 w-5" />}
                label="Data de Término"
                value={formatDate(event.end_date)}
              />
            )}

            {(event.city || event.state) && (
              <InfoRow
                iconBg="bg-rose-50"
                iconColor="text-rose-600"
                icon={<MapPin className="h-5 w-5" />}
                label="Localização"
                value={
                  <>
                    <span className="block">
                      {event.city}
                      {event.city && event.state && ', '}
                      {event.state}
                    </span>
                    {event.location && (
                      <span className="block text-sm text-slate-500 font-normal mt-0.5">
                        {event.location}
                      </span>
                    )}
                  </>
                }
              />
            )}

            {event.registration_deadline && (
              <InfoRow
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                icon={<Clock className="h-5 w-5" />}
                label="Prazo para Inscrição"
                value={formatDate(event.registration_deadline)}
              />
            )}

            {event.max_participants && (
              <InfoRow
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                icon={<Users className="h-5 w-5" />}
                label="Limite de Participantes"
                value={`${event.max_participants} pessoas`}
              />
            )}
          </div>
        </Card>

        {/* Descrição */}
        {event.description && (
          <Card className="p-6 sm:p-8 shadow-sm border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Sobre o Evento
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {event.description}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* ================== SIDEBAR ================== */}
      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        {/* Contato / CTA principal */}
        <Card className="p-6 shadow-sm border-slate-200">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Contato
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Fale com o organizador para mais informações.
          </p>

          {hasContact ? (
            <div className="space-y-3 text-sm">
              {event.contact_name && (
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                    Responsável
                  </p>
                  <p className="text-slate-900 font-semibold">{event.contact_name}</p>
                </div>
              )}
              {event.contact_phone && (
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                    Telefone
                  </p>
                  <a
                    href={`tel:${event.contact_phone.replace(/\D/g, '')}`}
                    className="text-slate-900 font-semibold hover:text-blue-600 transition-colors"
                  >
                    {event.contact_phone}
                  </a>
                </div>
              )}
              {(event.contact_email || event.organizer_email) && (
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                    Email
                  </p>
                  <a
                    href={`mailto:${event.contact_email || event.organizer_email}`}
                    className="text-blue-600 font-semibold hover:underline break-all"
                  >
                    {event.contact_email || event.organizer_email}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">
              Contato não informado pelo organizador.
            </p>
          )}
        </Card>

        {/* Compartilhar */}
        <Card className="p-6 shadow-sm border-slate-200 bg-gradient-to-br from-blue-50 to-white">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Divulgue este evento
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Compartilhe com seu público e amplie a audiência.
          </p>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={onShare}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Compartilhar link
          </Button>
        </Card>

        {/* Reportar */}
        <Card className="p-6 shadow-sm border-slate-200">
          <div className="flex items-start gap-3 mb-3">
            <div className="bg-red-50 p-2 rounded-lg shrink-0">
              <Flag className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Encontrou algo errado?
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ajude a manter a plataforma segura.
              </p>
            </div>
          </div>
          <EventReportDialog
            eventId={event.id}
            eventTitle={event.title}
            organizerId={event.organizer_id}
            organizerName={event.organizer_property || event.organizer_name}
          />
        </Card>
      </aside>
    </div>
  );
};

/* ---------------- Helper component ---------------- */

interface InfoRowProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, iconBg, iconColor, label, value }) => (
  <div className="flex items-start gap-3">
    <div className={`${iconBg} ${iconColor} p-2.5 rounded-lg shrink-0`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="text-slate-900 font-semibold mt-0.5">{value}</p>
    </div>
  </div>
);

export default EventDetailsContent;
