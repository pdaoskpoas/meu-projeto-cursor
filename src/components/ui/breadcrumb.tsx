import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from URL if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathnames = location.pathname.split('/').filter(x => x);
    
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/dashboard', icon: Home }
    ];

    // Map common dashboard routes
    const routeMap: Record<string, string> = {
      'animals': 'Meus Animais',
      'add-animal': 'Adicionar Equino',
      'edit-animal': 'Editar Equino',
      'events': 'Eventos',
      'stats': 'Estatísticas',
      'messages': 'Mensagens',
      'notifications': 'Notificações',
      'settings': 'Configurações',
      'favoritos': 'Favoritos',
      'help': 'Ajuda',
      'society': 'Sociedades',
      'institution-info': 'Planos',
      'upgrade-institutional': 'Upgrade'
    };

    pathnames.forEach((pathname, index) => {
      if (pathname === 'dashboard') return;
      
      const routeName = routeMap[pathname] || pathname;
      const href = index === pathnames.length - 1 ? undefined : `/${pathnames.slice(0, index + 1).join('/')}`;
      
      breadcrumbs.push({
        label: routeName,
        href
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  return (
    <nav className={cn('flex items-center space-x-2 text-sm', className)} aria-label="Breadcrumb">
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        const IconComponent = item.icon;

        return (
          <div key={index} className="flex items-center space-x-2">
            {item.href ? (
              <Link
                to={item.href}
                className="flex items-center space-x-1 text-slate-600 hover:text-blue-600 transition-colors duration-200 font-medium"
              >
                {IconComponent && <IconComponent className="h-4 w-4" />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className={cn(
                'flex items-center space-x-1 font-medium',
                isLast ? 'text-slate-900' : 'text-slate-600'
              )}>
                {IconComponent && <IconComponent className="h-4 w-4" />}
                <span>{item.label}</span>
              </span>
            )}
            
            {!isLast && (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;