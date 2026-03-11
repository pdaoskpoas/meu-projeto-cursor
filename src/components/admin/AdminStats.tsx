import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  CreditCard, 
  Activity, 
  FileText, 
  Globe, 
  Zap 
} from 'lucide-react';
import AdminStatsOverview from './stats/AdminStatsOverview';
import AdminStatsPlans from './stats/AdminStatsPlans';
import AdminStatsVisits from './stats/AdminStatsVisits';
import AdminStatsAds from './stats/AdminStatsAds';
import AdminStatsNews from './stats/AdminStatsNews';
import AdminStatsBoosted from './stats/AdminStatsBoosted';

const AdminStats: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const sections = [
    { id: 'overview', label: 'Visão Geral', icon: Users },
    { id: 'plans', label: 'Planos', icon: CreditCard },
    { id: 'visits', label: 'Visitas', icon: Activity },
    { id: 'ads', label: 'Anúncios', icon: FileText },
    { id: 'news', label: 'Notícias', icon: Globe },
    { id: 'boosted', label: 'Turbinados', icon: Zap },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <AdminStatsOverview />;
      case 'plans':
        return <AdminStatsPlans />;
      case 'visits':
        return <AdminStatsVisits />;
      case 'ads':
        return <AdminStatsAds />;
      case 'news':
        return <AdminStatsNews />;
      case 'boosted':
        return <AdminStatsBoosted />;
      default:
        return <AdminStatsOverview />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg">
        {sections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              variant={activeSection === section.id ? 'default' : 'outline'}
              size="sm"
              className="flex items-center gap-2"
            >
              <IconComponent className="h-4 w-4" />
              {section.label}
            </Button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminStats;

