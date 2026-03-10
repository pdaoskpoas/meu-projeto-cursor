import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AdminUsers } from '@/components/AdminUsers';
import { AdminNews } from '@/components/AdminNews';
import { AdminReports } from '@/components/AdminReports';
import { AdminPlans } from '@/components/AdminPlans';
import AdminStats from '@/components/AdminStats';
import AdminSociety from '@/components/AdminSociety';
import AdminTickets from '@/components/AdminTickets';
import AdminFinancial from '@/components/AdminFinancial';
import AdminMessages from '@/components/AdminMessages';
import AdminHarasMap from '@/components/AdminHarasMap';
import AdminSponsors from '@/components/AdminSponsors';
import AdminSubscriptions from '@/components/AdminSubscriptions';

import AdminChat from '@/components/AdminChat';

export type AdminSection = 'dashboard' | 'users' | 'plans' | 'news' | 'reports' | 'stats' | 'tickets' | 'financial' | 'messages' | 'haras' | 'chat' | 'sponsors' | 'society' | 'subscriptions';

const AdminPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const getSectionFromSearchParams = (): AdminSection => {
    const section = searchParams.get('section');
    const allowedSections: AdminSection[] = [
      'dashboard',
      'users',
      'plans',
      'news',
      'reports',
      'stats',
      'tickets',
      'financial',
      'messages',
      'haras',
      'chat',
      'sponsors',
      'society',
      'subscriptions',
    ];

    return allowedSections.includes(section as AdminSection) ? (section as AdminSection) : 'dashboard';
  };

  const activeSection = useMemo(getSectionFromSearchParams, [searchParams]);

  const handleSectionChange = (section: AdminSection) => {
    setSearchParams({ section }, { replace: true });
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <AdminUsers />;
      case 'plans':
        return <AdminPlans />;
      case 'news':
        return <AdminNews />;
      case 'reports':
        return <AdminReports />;
      case 'stats':
        return <AdminStats />;
      case 'tickets':
        return <AdminTickets />;
      case 'financial':
        return <AdminFinancial />;
      case 'subscriptions':
        return <AdminSubscriptions />;
        case 'messages':
          return <AdminMessages />;
        case 'sponsors':
          return <AdminSponsors />;
        case 'haras':
          return <AdminHarasMap />;
        case 'society':
          return <AdminSociety />;
        case 'chat':
          return <AdminChat />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AdminSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
          
          <main className="flex-1 overflow-hidden">
            <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-full items-center px-4 sm:px-6">
                <SidebarTrigger className="mr-2 sm:mr-4" />
                <h1 className="text-lg sm:text-2xl font-bold text-foreground">
                  <span className="hidden sm:inline">Painel Administrativo</span>
                  <span className="sm:hidden">Admin</span>
                </h1>
              </div>
            </header>
            
            <div className="p-4 sm:p-6 h-[calc(100vh-4rem)] overflow-y-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AdminPage;