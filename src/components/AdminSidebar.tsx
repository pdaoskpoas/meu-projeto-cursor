import React from 'react';
import {
  LayoutDashboard, 
  Users, 
  CreditCard, 
  FileText, 
  AlertTriangle, 
  BarChart3,
  MessageSquare,
  Crown,
  DollarSign,
  MessageCircle,
  MapPin,
  Building2,
  Users2,
  Clock,
  Coins
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
import { AdminSection } from '@/pages/AdminPage';

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}

const menuItems = [
  { id: 'dashboard' as AdminSection, title: 'Dashboard', icon: LayoutDashboard },
  { id: 'users' as AdminSection, title: 'Usuários', icon: Users },
  { id: 'plans' as AdminSection, title: 'Planos', icon: CreditCard },
  { id: 'subscriptions' as AdminSection, title: 'Assinaturas', icon: Clock },
  { id: 'news' as AdminSection, title: 'Dicas e Notícias', icon: FileText },
  { id: 'monetization' as AdminSection, title: 'Monetização', icon: Coins },
  { id: 'reports' as AdminSection, title: 'Denúncias', icon: AlertTriangle },
  { id: 'tickets' as AdminSection, title: 'Tickets', icon: MessageSquare },
  { id: 'messages' as AdminSection, title: 'Mensagens', icon: MessageCircle },
  { id: 'sponsors' as AdminSection, title: 'Patrocínio', icon: Building2 },
  { id: 'haras' as AdminSection, title: 'Mapa de Haras', icon: MapPin },
  { id: 'society' as AdminSection, title: 'Sociedades', icon: Users2 },
  { id: 'stats' as AdminSection, title: 'Estatísticas', icon: BarChart3 },
  { id: 'financial' as AdminSection, title: 'Financeiro', icon: DollarSign },
];

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const { state } = useSidebar();

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            {state !== "collapsed" && <span>Administração</span>}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    className={`w-full justify-start ${
                      activeSection === item.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                    {state !== "collapsed" && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}