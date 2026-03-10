import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppHeader from './AppHeader';
import ModernDashboardSidebar from './ModernDashboardSidebar';
import AppFooter from './AppFooter';
import { useAuth } from '@/contexts/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

// Definindo variável CSS para altura do footer
const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Detectar se é mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fechar sidebar no mobile quando navegar
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Determinar se deve mostrar sidebar (apenas para páginas do dashboard)
  const shouldShowSidebar = user && location.pathname.startsWith('/dashboard');
  
  // Determinar se é página de dashboard (usa wrapper especial)
  const isDashboardPage = location.pathname.startsWith('/dashboard');
  
  // Determinar se é página de autenticação (login/register)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (isDashboardPage) {
    // Layout para páginas do dashboard
    return (
      <SidebarProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col">
          {/* Header */}
          <AppHeader 
            onToggleSidebar={shouldShowSidebar ? toggleSidebar : undefined}
            sidebarOpen={sidebarOpen}
          />
          
          <div className="flex flex-1 relative">
            {/* Sidebar */}
            {shouldShowSidebar && <ModernDashboardSidebar />}
            
            {/* Page Content */}
            <main className="flex-1 pt-16 lg:pt-20 w-full">
              {children}
            </main>
          </div>
          
          {/* Footer - Full Width (não mostrar em páginas de autenticação) */}
          {!isAuthPage && (
            <AppFooter 
              sidebarOpen={sidebarOpen}
              hasSidebar={shouldShowSidebar}
            />
          )}
        </div>
      </SidebarProvider>
    );
  }

  // Layout para páginas públicas (home, buscar, etc.)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Facebook Pixel será adicionado aqui */}
      
      {!isAuthPage && (
        <AppHeader 
          onToggleSidebar={undefined}
          sidebarOpen={false}
        />
      )}

      <main className={isAuthPage ? "flex-1" : "flex-1 pt-16 lg:pt-20"}>
        {children}
      </main>

      {/* Footer (não mostrar em páginas de autenticação) */}
      {!isAuthPage && (
        <AppFooter 
          sidebarOpen={false}
          hasSidebar={false}
        />
      )}
    </div>
  );
};

export default AppLayout;
