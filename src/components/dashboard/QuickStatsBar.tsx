import React from 'react';
import { TrendingUp, Eye, Users, Calendar, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStats } from '@/hooks/useUserStats';

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
}

interface QuickStatsBarProps {
  stats?: QuickStat[];
  className?: string;
}

const QuickStatsBar: React.FC<QuickStatsBarProps> = ({ stats, className = '' }) => {
  const userStats = useUserStats();
  
  const defaultStats: QuickStat[] = [
    {
      label: 'Visualizações',
      value: userStats.totalViews.toLocaleString(),
      icon: Eye,
      change: { value: 12, type: 'increase' }
    },
    {
      label: 'Animais Ativos',
      value: userStats.activeAnimals,
      icon: Users,
      change: { value: 2, type: 'increase' }
    },
    {
      label: 'Este Mês',
      value: userStats.monthlyViews.toLocaleString(),
      icon: Calendar,
      change: { value: 8, type: 'increase' }
    },
    {
      label: 'Impulsionamentos',
      value: `${userStats.availableBoosts} disponíveis`,
      icon: Zap,
      change: userStats.availableBoosts > 0 
        ? { value: userStats.availableBoosts, type: 'increase' }
        : { value: 0, type: 'neutral' }
    }
  ];

  const displayStats = stats || defaultStats;

  const getChangeColor = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase': return 'text-green-600';
      case 'decrease': return 'text-red-600';
      case 'neutral': return 'text-slate-600';
    }
  };

  const getChangeIcon = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase': return '↗';
      case 'decrease': return '↘';
      case 'neutral': return '→';
    }
  };

  return (
    <div className={`flex flex-wrap gap-4 lg:gap-6 ${className}`}>
      {displayStats.map((stat, index) => {
        const IconComponent = stat.icon;
        
        return (
          <div 
            key={index} 
            className="flex items-center space-x-3 bg-white backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 min-w-[140px] hover:shadow-md hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-0.5 group cursor-pointer"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-all duration-300 group-hover:scale-110">
              <IconComponent className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-600 truncate group-hover:text-blue-600 transition-colors">
                {stat.label}
              </p>
              <div className="flex items-center space-x-2">
                <p className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {stat.value}
                </p>
                {stat.change && (
                  <span className={cn(
                    'text-xs font-semibold flex items-center transition-all duration-300',
                    getChangeColor(stat.change.type),
                    stat.change.type === 'increase' && 'group-hover:scale-110'
                  )}>
                    <span className="mr-1">{getChangeIcon(stat.change.type)}</span>
                    {stat.change.value}%
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuickStatsBar;
