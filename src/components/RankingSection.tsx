import React, { useMemo } from 'react';
import { TrendingUp, Eye, Trophy, BarChart3, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useViewPermissions } from '@/hooks/useViewPermissions';
import { useMostViewedAnimals } from '@/hooks/useMostViewedAnimals';
import { getAge } from '@/utils/animalAge';
import { getPlaceholderGallery } from '@/utils/animalCard';

const RankingSection = () => {
  const { canViewAllViews } = useViewPermissions();
  const { animals, isLoading, error } = useMostViewedAnimals(12);

  const topHorses = useMemo(() => animals.slice(0, 3), [animals]);
  const breedStats = useMemo(() => {
    const grouped = animals.reduce<Record<string, number>>((acc, animal) => {
      const breed = animal.breed || 'Sem raca informada';
      acc[breed] = (acc[breed] ?? 0) + 1;
      return acc;
    }, {});

    const total = animals.length || 1;

    return Object.entries(grouped)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([breed, count]) => ({
        breed,
        count,
        percentage: Math.round((count / total) * 100),
      }));
  }, [animals]);

  const totalViews = useMemo(
    () => animals.reduce((sum, animal) => sum + (animal.impression_count ?? 0), 0),
    [animals]
  );

  return (
    <section className="section-spacing">
      <div className="container-responsive">
        <div className="text-center space-content mb-8 sm:mb-12">
          <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm font-medium text-primary">
            <TrendingUp className="h-4 w-4" />
            <span>Buscar & Estatísticas</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-blue-dark text-balance">
            Animais Mais Acessados
          </h2>
          <p className="text-base sm:text-lg text-gray-medium max-w-2xl mx-auto leading-relaxed">
            Veja quais cavalos estão chamando mais atenção da nossa comunidade 
            e as raças em maior evidência.
          </p>
        </div>

        <div className="grid-responsive lg:grid-cols-3">
          <div className="lg:col-span-2 space-content">
            <h3 className="text-xl font-semibold text-blue-dark flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-accent" />
              <span>Top 3 Mais Visualizados</span>
            </h3>
            
            <div className="space-compact">
              {isLoading && (
                <Card className="card-professional p-6">
                  <div className="flex items-center gap-3 text-gray-medium">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Carregando ranking...</span>
                  </div>
                </Card>
              )}

              {!isLoading && error && (
                <Card className="card-professional p-6">
                  <p className="text-sm text-red-600">
                    Nao foi possivel carregar o ranking agora. Tente novamente em instantes.
                  </p>
                </Card>
              )}

              {!isLoading && !error && topHorses.length === 0 && (
                <Card className="card-professional p-6">
                  <p className="text-sm text-gray-medium">
                    Ainda nao ha dados suficientes para montar o ranking publico.
                  </p>
                </Card>
              )}

              {!isLoading && !error && topHorses.map((horse, index) => (
                <Card key={horse.id} className="card-professional p-4 sm:p-6 hover:cursor-pointer">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg ${
                        index === 0 ? 'bg-accent text-accent-foreground' :
                        index === 1 ? 'bg-primary text-primary-foreground' :
                        'bg-gray-light text-blue-dark border border-border'
                      }`}>
                        {index + 1}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <div className="img-rounded">
                        <img
                          src={horse.images?.[0] || getPlaceholderGallery()[0]}
                          alt={horse.name}
                          loading="lazy"
                          decoding="async"
                          className="img-cover w-16 h-16 sm:w-20 sm:h-20 shadow-card"
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-blue-dark text-base sm:text-lg truncate">{horse.name}</h4>
                      <p className="text-sm text-gray-medium font-medium">{horse.breed} • {getAge(horse.birth_date)}</p>
                      <p className="text-sm text-primary font-medium hover:text-primary/80 cursor-pointer truncate">
                        {horse.haras_name || 'Perfil do anunciante'}
                      </p>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      {canViewAllViews && (
                        <div className="flex items-center space-x-2 text-gray-medium mb-2">
                          <Eye className="h-4 w-4" />
                          <span className="font-semibold text-sm">
                            {(horse.impression_count ?? 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {index === 0 && (
                        <Badge className="bg-accent/10 text-accent border-accent/20 font-medium text-xs">
                          Em Alta
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Breed Statistics */}
          <div className="space-content">
            <h3 className="text-xl font-semibold text-blue-dark flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>Raças em Destaque</span>
            </h3>
            
            <Card className="card-professional p-4 sm:p-6">
              <div className="space-content">
                {breedStats.length === 0 && (
                  <p className="text-sm text-gray-medium">Sem dados agregados suficientes no momento.</p>
                )}

                {breedStats.map((stat) => (
                  <div key={stat.breed} className="space-compact">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-blue-dark text-sm">{stat.breed}</span>
                      <span className="text-gray-medium font-medium text-sm">{stat.count}</span>
                    </div>
                    <div className="w-full bg-gray-light rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-medium font-medium">{stat.percentage}% do total</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="card-featured p-4 sm:p-6">
              <h4 className="font-semibold text-blue-dark mb-4 sm:mb-6">Estatísticas Gerais</h4>
              <div className="space-compact">
                {canViewAllViews ? (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-medium font-medium text-sm">Total de Visualizações</span>
                    <span className="font-bold text-blue-dark">{totalViews.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-medium font-medium text-sm">Animais Cadastrados</span>
                    <span className="font-bold text-blue-dark">{animals.length.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-medium font-medium text-sm">Animais com dados de ranking</span>
                  <span className="font-bold text-primary">{animals.length.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-medium font-medium text-sm">Raças monitoradas</span>
                  <span className="font-bold text-accent">{breedStats.length.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RankingSection;