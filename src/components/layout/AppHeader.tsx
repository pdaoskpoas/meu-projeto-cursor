import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Search, 
  Calendar, 
  TrendingUp, 
  HelpCircle, 
  Bell, 
  User, 
  LogOut,
  Settings,
  Shield,
  PanelLeft,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationsDropdown } from '@/components/layout/NotificationsDropdown';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface AppHeaderProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onToggleSidebar, sidebarOpen }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;
  const isDashboardRoute = location.pathname.startsWith('/dashboard');

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  // Fechar menu mobile ao navegar
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Fechar user dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside as EventListener);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [isUserMenuOpen]);

  // Bloquear scroll do body quando menu mobile está aberto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-lg">
      <div className={`container mx-auto px-3 sm:px-4 ${isDashboardRoute && user ? '' : ''}`}>
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex shrink-0 items-center space-x-2 sm:space-x-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
              <div className="relative">
                <img
                  src="/logo.png.png"
                  alt="Logo Vitrine do Cavalo"
                  width="48"
                  height="48"
                  className="w-10 h-10 lg:w-12 lg:h-12 object-contain drop-shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-2xl lg:text-3xl"></span>
                </div>
              </div>
              <div>
                <h1 className="whitespace-nowrap text-base sm:text-lg lg:text-2xl font-bold text-slate-900">
                  Vitrine do Cavalo
                </h1>
              </div>
            </Link>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center space-x-2">
            <Link
              to="/"
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                isActive('/')
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Início
            </Link>
            <Link
              to="/sobre"
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                isActive('/sobre')
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>Sobre Nós</span>
            </Link>
            <Link
              to="/buscar"
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                isActive('/buscar')
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Buscar</span>
            </Link>
            <Link
              to="/ranking"
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                isActive('/ranking')
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Award className="h-4 w-4" />
              <span>Ranking</span>
            </Link>
            <Link
              to="/noticias"
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                isActive('/noticias')
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Notícias</span>
            </Link>
            <Link
              to="/eventos"
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                isActive('/eventos')
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Eventos</span>
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex min-w-0 shrink items-center space-x-1.5 sm:space-x-3">
            {/* Ícone de busca rápida mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => navigate('/buscar')}
              aria-label="Buscar"
            >
              <Search className="h-5 w-5 text-slate-600" />
            </Button>

            {user ? (
              // Usuário Logado
              <>
                {/* Notificações */}
                <NotificationsDropdown />

                {/* Menu do Usuário */}
                <div className="relative" ref={userMenuRef}>
                  <Button
                    variant="ghost"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 hover:bg-gray-100 px-2 sm:px-3 py-2 rounded-xl"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        width="32"
                        height="32"
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm ${user.avatar ? 'hidden' : ''}`}>
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="hidden md:block text-left max-w-[140px]">
                      <div className="text-sm font-semibold text-gray-900 truncate">{user.name?.split(' ')[0]}</div>
                      <div className="text-xs text-gray-600 truncate">
                        {user.accountType === 'institutional' ? user.propertyName : 'Conta Pessoal'}
                      </div>
                    </div>
                  </Button>

                  {/* Dropdown Menu com overlay mobile */}
                  {isUserMenuOpen && (
                    <>
                      {/* Overlay invisível para fechar em mobile */}
                      <div 
                        className="fixed inset-0 z-40 sm:hidden" 
                        onClick={() => setIsUserMenuOpen(false)} 
                      />
                      <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="font-semibold text-gray-900 break-words">{user.name}</div>
                          <div className="text-sm text-gray-600 break-all">{user.email}</div>
                          {user.accountType === 'institutional' && (
                            <div className="text-xs text-blue-600 font-medium mt-1">{user.propertyName}</div>
                          )}
                        </div>
                        
                        <Link
                          to="/dashboard"
                          className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors min-h-[44px]"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">Meu Painel</span>
                        </Link>
                        
                        <Link
                          to="/dashboard/settings"
                          className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors min-h-[44px]"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">Configurações</span>
                        </Link>
                        
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors w-full text-left min-h-[44px]"
                        >
                          <LogOut className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">Sair</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              // Usuário Não Logado — botão Acessar em mobile, Entrar/Cadastrar em desktop
              <div className="flex items-center space-x-1.5 sm:space-x-3">
                <Link to="/login">
                  <Button variant="outline" className="hidden sm:flex">
                    Entrar
                  </Button>
                  <Button className="sm:hidden px-3 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                    Acessar
                  </Button>
                </Link>
                <Link to="/register" className="hidden sm:block">
                  <Button className="h-10 px-4 text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                    Cadastrar
                  </Button>
                </Link>
              </div>
            )}

            {/* Sidebar Toggle - apenas no dashboard em mobile */}
            {isDashboardRoute && user && (
              <SidebarTrigger className="lg:hidden h-11 w-11 sm:h-10 sm:w-10" />
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation com overlay */}
      {isMenuOpen && (
        <>
          {/* Overlay escuro */}
          <div 
            className="lg:hidden fixed inset-0 top-16 bg-black/50 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          {/* Menu */}
          <div className="lg:hidden fixed inset-x-0 top-16 border-t border-slate-200 bg-white shadow-lg z-50">
            <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto px-3 py-4 sm:px-4">
              <nav className="space-y-1">
                <Link
                  to="/"
                  className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl font-semibold transition-all min-h-[48px] ${
                    isActive('/')
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>Início</span>
                </Link>

                <Link
                  to="/sobre"
                  className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl font-semibold transition-all min-h-[48px] ${
                    isActive('/sobre')
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>Sobre Nós</span>
                </Link>

                <Link
                  to="/buscar"
                  className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl font-semibold transition-all min-h-[48px] ${
                    isActive('/buscar')
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Search className="h-5 w-5" />
                  <span>Buscar</span>
                </Link>

                <Link
                  to="/ranking"
                  className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl font-semibold transition-all min-h-[48px] ${
                    isActive('/ranking')
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Award className="h-5 w-5" />
                  <span>Ranking</span>
                </Link>

                <Link
                  to="/noticias"
                  className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl font-semibold transition-all min-h-[48px] ${
                    isActive('/noticias')
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <TrendingUp className="h-5 w-5" />
                  <span>Notícias</span>
                </Link>

                <Link
                  to="/eventos"
                  className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl font-semibold transition-all min-h-[48px] ${
                    isActive('/eventos')
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Calendar className="h-5 w-5" />
                  <span>Eventos</span>
                </Link>

                {!user && (
                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full h-12">
                        Entrar
                      </Button>
                    </Link>
                    <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                        Cadastrar
                      </Button>
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default AppHeader;
