import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Eye, Heart, Share2, Star, TrendingUp, MousePointerClick } from 'lucide-react';
import { NewsStats as NewsStatsType } from './types';

interface NewsStatsProps {
  stats: NewsStatsType;
}

const NewsStats: React.FC<NewsStatsProps> = ({ stats }) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const statsCards = [
    {
      title: 'Total de Artigos',
      value: formatNumber(stats.totalArticles),
      icon: FileText,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Publicados',
      value: formatNumber(stats.publishedArticles),
      icon: Eye,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Rascunhos',
      value: formatNumber(stats.draftArticles),
      icon: FileText,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      title: 'Agendados',
      value: formatNumber(stats.scheduledArticles),
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      title: 'Em Destaque',
      value: formatNumber(stats.highlightedArticles),
      icon: Star,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    {
      title: 'Total de Visualizações',
      value: formatNumber(stats.totalViews),
      icon: Eye,
      color: 'bg-cyan-500',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-700'
    },
    {
      title: 'Total de Cliques',
      value: formatNumber(stats.totalClicks || 0),
      icon: MousePointerClick,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      title: 'Total de Curtidas',
      value: formatNumber(stats.totalLikes),
      icon: Heart,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    {
      title: 'Total de Compartilhamentos',
      value: formatNumber(stats.totalShares),
      icon: Share2,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statsCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className={`${stat.bgColor} border-0`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${stat.textColor}`}>
                {stat.title}
              </CardTitle>
              <div className={`p-2 ${stat.color} rounded-lg`}>
                <IconComponent className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.textColor}`}>
                {stat.value}
              </div>
              {index >= 5 && stats.totalArticles > 0 && (
                <p className={`text-xs ${stat.textColor} mt-1`}>
                  Média: {formatNumber(
                    index === 5 ? stats.averageViews :
                    index === 6 ? (stats.averageClicks || 0) :
                    index === 7 ? stats.averageLikes :
                    stats.averageShares
                  )} por artigo
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default NewsStats;

