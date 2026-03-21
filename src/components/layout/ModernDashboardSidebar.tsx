import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar,
  BarChart3, 
  User,
  Settings, 
  MessageCircle,
  Bell,
  Heart,
  HelpCircle,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Plus,
  LogOut,
  Crown,
  Building2,
  TrendingUp,
  Zap,
  Upload,
  Download,
  Sparkles
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { useAnimalAlerts } from '@/hooks/useAnimalAlerts';

interface SidebarGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SidebarItem[];
  collapsible?: boolean;
}

interface SidebarItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: {
    count: number;
    variant?: 'default' | 'destructive' | 'secondary';
  };
  description?: string;
}

export function ModernDashboardSidebar() {
  const { user, logout } = useAuth();
  const { counts } = useUnreadCounts();
  const { alertCount } = useAnimalAlerts();
  const location = useLocation();
  const { toggleSidebar } = useSidebar();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  
  // Referência para o footer para cálculo de altura dinâmica
  const footerRef = React.useRef<HTMLDivElement | null>(null);

  const toggleGroup = (groupLabel: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupLabel)) {
        newSet.delete(groupLabel);
      } else {
        newSet.add(groupLabel);
      }
      return newSet;
    });
  };

  // Keyboard shortcuts navigation
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case '1':
            e.preventDefault();
            navigate('/dashboard');
            break;
          case '2':
            e.preventDefault();
            navigate('/dashboard/animals');
            break;
          case 'n':
            e.preventDefault();
            // Sistema de cadastro será reconstruído
            break;
          case 'm':
            e.preventDefault();
            navigate('/dashboard/messages');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  // Organize menu items by groups
  const sidebarGroups: SidebarGroup[] = [
    {
      label: "Dashboard",
      icon: Home,
      items: [
        { 
          title: "Dashboard", 
          url: "/dashboard", 
          icon: Home
        }
      ]
    },
    {
      label: "Meus Animais",
      icon: Users,
      items: [
        { 
          title: "Meus Animais", 
          url: "/dashboard/animals", 
          icon: Users,
          badge: alertCount > 0 ? { count: alertCount, variant: 'destructive' as const } : undefined
        }
      ]
    },
    {
      label: "Estatísticas",
      icon: BarChart3,
      items: [
        { 
          title: "Estatísticas", 
          url: "/dashboard/stats", 
          icon: BarChart3
        }
      ]
    },
    {
      label: "Mensagens",
      icon: MessageCircle,
      items: [
        { 
          title: "Mensagens", 
          url: "/dashboard/messages", 
          icon: MessageCircle,
          badge: counts.messages > 0 ? { count: counts.messages, variant: 'destructive' as const } : undefined
        },
        { 
          title: "Notificações", 
          url: "/dashboard/notifications", 
          icon: Bell,
          badge: counts.notifications > 0 ? { count: counts.notifications, variant: 'destructive' as const } : undefined
        },
        { 
          title: "Favoritos", 
          url: "/dashboard/favoritos", 
          icon: Heart
        }
      ]
    },
    {
      label: "Eventos",
      icon: Calendar,
      items: [
        { 
          title: "Eventos", 
          url: "/dashboard/events", 
          icon: Calendar
        },
        { 
          title: "Sociedades", 
          url: "/dashboard/society", 
          icon: UserPlus,
          badge: counts.partnerships > 0 ? { count: counts.partnerships, variant: 'destructive' as const } : undefined
        },
        { 
          title: "Planos Premium", 
          url: "/planos", 
          icon: Crown
        }
      ]
    },
    {
      label: "Perfil",
      icon: Settings,
      items: [
        { 
          title: "Configurações", 
          url: "/dashboard/settings", 
          icon: Settings
        },
        { 
          title: "Central de Ajuda", 
          url: "/ajuda", 
          icon: HelpCircle
        }
      ]
    }
  ];

  const isActive = (url: string) => location.pathname === url;

  return (
    <Sidebar className="border-r border-slate-200 bg-white h-[calc(100vh-5rem)] overflow-hidden sticky top-20 z-20">
      <SidebarContent className="px-0 overflow-y-auto h-full">
        {/* User Profile Section */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <UserAvatar 
                user={user} 
                className="w-12 h-12"
              />
              {user?.accountType === 'institutional' && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  <Crown className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {user?.name}
              </p>
              <div className="flex items-center space-x-1 mt-0.5">
                <p className="text-xs text-slate-600 truncate">
                  {user?.accountType === 'institutional' ? user?.propertyName || 'Haras' : 'Perfil Pessoal'}
                </p>
                {user?.plan && user.plan !== 'free' && (
                  <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-4 border ${
                    user.plan === 'vip' ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200' :
                    user.plan === 'elite' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                    user.plan === 'haras' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                    user.plan === 'criador' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                    user.plan === 'essencial' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    'bg-green-100 text-green-700 border-green-200'
                  }`}>
                    {user.plan.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - Temporariamente desabilitado */}

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto">
          <SidebarGroup className="px-0">
            <SidebarGroupContent className="px-2">
              <SidebarMenu>
                {sidebarGroups.flatMap(group => group.items).map((item) => {
                  const ItemIcon = item.icon;
                  const active = isActive(item.url);

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild
                        className={cn(
                          "w-full h-11 rounded-lg mx-2 mb-1 transition-all duration-200 relative overflow-hidden",
                          active 
                            ? "bg-blue-50 text-blue-700 shadow-sm font-semibold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-600 before:rounded-l-lg" 
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm font-medium"
                        )}
                      >
                        <Link to={item.url} onClick={toggleSidebar}>
                          <div className="flex items-center justify-between w-full pl-1">
                            <div className="flex items-center space-x-3">
                              <ItemIcon className={cn(
                                "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                                active ? "text-blue-600 scale-110" : "text-slate-500",
                                !active && "group-hover:scale-105"
                              )} />
                              <p className={cn(
                                "truncate transition-all duration-200",
                                active && "font-bold"
                              )}>
                                {item.title}
                              </p>
                            </div>
                            
                            {item.badge && item.badge.count > 0 && (
                              <Badge 
                                variant={item.badge.variant || 'default'}
                                className={cn(
                                  "ml-2 h-5 min-w-[20px] text-xs font-semibold shadow-sm",
                                  item.badge.variant === 'destructive' && "bg-red-500 text-white animate-pulse"
                                )}
                              >
                                {item.badge.count}
                              </Badge>
                            )}
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <Button
            onClick={logout}
            variant="ghost"
            className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50 h-10 transition-all duration-200"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sair da Conta
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default ModernDashboardSidebar;




