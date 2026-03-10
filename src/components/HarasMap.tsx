import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ExternalLink, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const HarasMap = () => {
  return (
    <section className="section-blue section-spacing">
      <div className="container-responsive">
        <div className="mb-8 sm:mb-12">
          <Card className="card-featured p-6 sm:p-8 bg-white">
            <div className="bg-gray-light rounded-xl h-64 sm:h-80 lg:h-96 flex items-center justify-center relative overflow-hidden">
              <div className="text-center space-content px-4">
                <MapPin className="h-12 w-12 sm:h-16 sm:w-16 text-primary mx-auto" />
                <h3 className="text-lg sm:text-xl font-semibold text-blue-dark">Mapa de Haras</h3>
                <p className="text-sm sm:text-base text-gray-medium max-w-xl">
                  Estamos preparando uma experiencia de mapa com dados reais dos haras publicados.
                  Enquanto isso, voce pode navegar pelos perfis disponiveis na busca e nas paginas publicas.
                </p>
                <Link to="/buscar">
                  <Button className="mt-4">
                    Explorar animais e haras publicados
                  </Button>
                </Link>
              </div>

              <div className="absolute top-16 left-1/3 w-3 h-3 sm:w-4 sm:h-4 bg-accent rounded-full shadow-elevated animate-pulse" />
              <div className="absolute top-24 right-1/4 w-3 h-3 sm:w-4 sm:h-4 bg-primary rounded-full shadow-elevated animate-pulse" style={{animationDelay: '0.5s'}} />
              <div className="absolute bottom-20 left-1/4 w-3 h-3 sm:w-4 sm:h-4 bg-blue-medium rounded-full shadow-elevated animate-pulse" style={{animationDelay: '1s'}} />
            </div>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Perfis publicados',
              description: 'Os perfis ativos continuam disponiveis nas rotas publicas e nos resultados de busca.',
            },
            {
              title: 'Localizacao confiavel',
              description: 'O mapa sera ativado quando os dados geograficos estiverem consistentes para todos os perfis.',
            },
            {
              title: 'Experiencia gradual',
              description: 'Preferimos nao exibir localizacoes simuladas para manter a navegacao profissional e confiavel.',
            },
          ].map((item) => (
            <Card key={item.title} className="card-professional p-6 bg-white">
              <div className="flex items-start gap-3">
                <Building2 className="mt-1 h-5 w-5 text-primary" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-blue-dark">{item.title}</h3>
                  <p className="text-sm text-gray-medium leading-relaxed">{item.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <Link to="/buscar">
            <Button variant="outline" size="lg" className="font-medium">
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir busca publica
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HarasMap;