import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  User,
  Star
} from 'lucide-react';
import { mockEvents, getUpcomingEvents } from '@/data/eventsData';
import { sanitizeRichText } from '@/utils/sanitize';
import heroHorse from '@/assets/hero-horse.jpg';
import mangalarga from '@/assets/mangalarga.jpg';
import quarterHorse from '@/assets/quarter-horse.jpg';
import thoroughbred from '@/assets/thoroughbred.jpg';

const fallbackImage = '/placeholder.svg';
const eventImages: Record<string, string> = {
  'hero-horse': heroHorse,
  mangalarga,
  'quarter-horse': quarterHorse,
  thoroughbred,
};

const EventPage = () => {
  const { id } = useParams<{ id: string }>();
  const event = mockEvents.find(e => e.id === id);
  const relatedEvents = getUpcomingEvents(3).filter(e => e.id !== id);

  if (!event) {
    return (
      <main className="container mx-auto px-4 py-8 min-h-screen bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Evento não encontrado</h1>
            <Link to="/eventos">
              <Button>Voltar para eventos</Button>
            </Link>
          </div>
      </main>
    );
  }

  const getImageSrc = (imageName: string) => eventImages[imageName] || fallbackImage;

  const formatDate = (dateString: string, endDate?: string) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    
    if (endDate) {
      const endDateFormatted = new Date(endDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long'
      });
      return `${formattedDate} a ${endDateFormatted}`;
    }
    
    return formattedDate;
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };


  return (
    <main className="overflow-hidden min-h-screen bg-background">
        {/* Navegação */}
        <section className="section-spacing bg-white">
          <div className="container-responsive">
            <Link to="/eventos">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para eventos
              </Button>
            </Link>
          </div>
        </section>

        {/* Conteúdo Principal */}
        <section className="section-spacing bg-gray-light">
          <div className="container-responsive">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Evento principal */}
              <article className="lg:col-span-3">
                {/* Cabeçalho do evento */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Badge className="bg-primary text-white">{event.category}</Badge>
                    {event.featured && (
                      <Badge className="bg-accent text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Em Destaque
                      </Badge>
                    )}
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                    {event.title}
                  </h1>
                  
                  {/* Informações básicas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="flex items-center text-slate-600">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">Data:</span>
                        <p className="text-slate-600">{formatDate(event.date, event.endDate)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-slate-600">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                        <Clock className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">Horário:</span>
                        <p className="text-slate-600">{formatTime(event.time)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-slate-600">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">Local:</span>
                        <p className="text-slate-600">{event.location.city}, {event.location.state}</p>
                        {event.location.fullAddress && (
                          <p className="text-sm text-slate-500">{event.location.fullAddress}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-slate-600">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">Organizador:</span>
                        <p className="text-slate-600">{event.organizer}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Imagem principal */}
                <div className="aspect-video overflow-hidden rounded-xl mb-8 shadow-lg">
                  <img
                    src={getImageSrc(event.image)}
                    alt={event.title}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Descrição do evento */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-6">Sobre o Evento</h2>
                  <div 
                    className="prose prose-lg max-w-none text-slate-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichText(event.fullDescription) }}
                  />
                </div>

                {/* Informações de inscrição */}
                {event.registrationInfo && (
                  <Card className="mb-8 card-professional">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-3">Informações de Inscrição</h3>
                      <p className="text-slate-600 mb-4">{event.registrationInfo}</p>
                    </CardContent>
                  </Card>
                )}


          </article>

              {/* Sidebar */}
              <aside className="space-y-8">

                {/* Informações de contato */}
                <Card className="card-professional">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Informações</h3>
                    <div className="space-y-4 text-sm">
                      <div>
                        <span className="font-semibold text-slate-900">Organizador:</span>
                        <p className="text-slate-600">{event.organizer}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">Categoria:</span>
                        <p className="text-slate-600">{event.category}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">Local:</span>
                        <p className="text-slate-600">
                          {event.location.city}, {event.location.state}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cadastrar Evento */}
                <Card className="card-professional bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Cadastrar Evento</h3>
                    <p className="text-sm text-slate-600 mb-6">
                      Divulgue seu evento na nossa plataforma e alcance milhares de pessoas interessadas no mundo equestre.
                    </p>
                    <Button className="w-full btn-primary">
                      Cadastrar Evento
                    </Button>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </div>
        </section>

        {/* Eventos Mais Acessados */}
        <section className="section-spacing bg-white">
          <div className="container-responsive">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Eventos Mais Acessados
              </h2>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="space-y-3">
                {mockEvents.slice(0, 5).map((event, index) => (
                  <Link
                    key={event.id}
                    to={`/eventos/${event.id}`}
                    className="block group p-4 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
    </main>
  );
};

export default EventPage;