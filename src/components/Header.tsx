import React, { useState } from 'react';
import { Menu, X, Search, Users, Calendar, Shield, Award, Phone, Eye, TrendingUp, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-lg">
        <div className="container-responsive">
          <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20">
            {/* Logo - Responsive */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-4">
              <div className="relative">
                <img 
                  src="/logo.png.png" 
                  alt="Logo Vitrine do Cavalo"
                  className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 object-contain drop-shadow-lg"
                  onError={(e) => {
                    // Fallback se a imagem não carregar
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg sm:text-xl lg:text-2xl"></span>
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
                  Vitrine do Cavalo
                </h1>
                <div className="hidden sm:flex items-center space-x-2">
                  <span className="text-xs text-slate-600 font-semibold tracking-wider uppercase">
                    PLATAFORMA PREMIUM
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation - Enhanced */}
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-8">
              <Link
                to="/"
                className={`text-sm font-semibold transition-all duration-300 hover:text-blue-600 relative ${
                  isActive('/') ? 'text-blue-600' : 'text-slate-700'
                }`}
              >
                Início
                {isActive('/') && <div className="absolute -bottom-6 left-0 right-0 h-0.5 bg-blue-600"></div>}
              </Link>
              <Link
                to="/sobre"
                className={`text-sm font-semibold transition-all duration-300 hover:text-blue-600 relative ${
                  isActive('/sobre') ? 'text-blue-600' : 'text-slate-700'
                }`}
              >
                Sobre Nós
                {isActive('/sobre') && <div className="absolute -bottom-6 left-0 right-0 h-0.5 bg-blue-600"></div>}
              </Link>
              <Link
                to="/buscar"
                className={`text-sm font-semibold transition-all duration-300 hover:text-blue-600 flex items-center space-x-2 relative ${
                  isActive('/buscar') ? 'text-blue-600' : 'text-slate-700'
                }`}
              >
                <Search className="h-4 w-4" />
                <span>Buscar</span>
                {isActive('/buscar') && <div className="absolute -bottom-6 left-0 right-0 h-0.5 bg-blue-600"></div>}
              </Link>
              <Link
                to="/ranking"
                className={`text-sm font-semibold transition-all duration-300 hover:text-blue-600 flex items-center space-x-2 relative ${
                  isActive('/ranking') ? 'text-blue-600' : 'text-slate-700'
                }`}
              >
                <Award className="h-4 w-4" />
                <span>Ranking</span>
                {isActive('/ranking') && <div className="absolute -bottom-6 left-0 right-0 h-0.5 bg-blue-600"></div>}
              </Link>
              <Link
                to="/noticias"
                className={`text-sm font-semibold transition-all duration-300 hover:text-blue-600 flex items-center space-x-2 relative ${
                  isActive('/noticias') ? 'text-blue-600' : 'text-slate-700'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Notícias</span>
                {isActive('/noticias') && <div className="absolute -bottom-6 left-0 right-0 h-0.5 bg-blue-600"></div>}
              </Link>
              <Link
                to="/eventos"
                className={`text-sm font-semibold transition-all duration-300 hover:text-blue-600 flex items-center space-x-2 relative ${
                  isActive('/eventos') ? 'text-blue-600' : 'text-slate-700'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Eventos</span>
                {isActive('/eventos') && <div className="absolute -bottom-6 left-0 right-0 h-0.5 bg-blue-600"></div>}
              </Link>
            </nav>

            {/* CTA - Enhanced */}
            <div className="hidden md:flex items-center space-x-4">
              
              {user ? (
                <Link to="/dashboard">
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                    Meu Painel
                  </Button>
                </Link>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login">
                    <Button variant="ghost" className="text-slate-700 hover:text-blue-600 font-semibold">
                      Entrar
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                      Destacar Meus Cavalos
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {isMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6 text-slate-700" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-slate-700" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 sm:py-6 border-t border-slate-200 bg-white shadow-lg">
              <nav className="space-y-4">
                <Link
                  to="/"
                  className={`flex items-center py-3 font-semibold transition-colors ${
                    isActive('/') ? 'text-blue-600' : 'text-slate-700 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Início
                </Link>
                <Link
                  to="/sobre"
                  className={`flex items-center py-3 font-semibold transition-colors ${
                    isActive('/sobre') ? 'text-blue-600' : 'text-slate-700 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sobre Nós
                </Link>
                <Link
                  to="/buscar"
                  className={`flex items-center py-3 font-semibold transition-colors space-x-3 ${
                    isActive('/buscar') ? 'text-blue-600' : 'text-slate-700 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Search className="h-5 w-5" />
                  <span>Buscar</span>
                </Link>
                <Link
                  to="/ranking"
                  className={`flex items-center py-3 font-semibold transition-colors space-x-3 ${
                    isActive('/ranking') ? 'text-blue-600' : 'text-slate-700 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Award className="h-5 w-5" />
                  <span>Ranking</span>
                </Link>
                <Link
                  to="/noticias"
                  className={`flex items-center py-3 font-semibold transition-colors space-x-3 ${
                    isActive('/noticias') ? 'text-blue-600' : 'text-slate-700 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Users className="h-5 w-5" />
                  <span>Notícias</span>
                </Link>
                <Link
                  to="/eventos"
                  className={`flex items-center py-3 font-semibold transition-colors space-x-3 ${
                    isActive('/eventos') ? 'text-blue-600' : 'text-slate-700 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Calendar className="h-5 w-5" />
                  <span>Eventos</span>
                </Link>
                <div className="pt-6 border-t border-slate-200 space-y-3">
                  
                  {user ? (
                    <Link to="/dashboard" className="block" onClick={() => setIsMenuOpen(false)}>
                      <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white w-full py-3 font-semibold shadow-lg">
                        Meu Painel
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link to="/login" className="block" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" className="w-full py-3 font-semibold border-2 border-slate-300 hover:border-blue-600 hover:text-blue-600">
                          Entrar
                        </Button>
                      </Link>
                      <Link to="/register" className="block" onClick={() => setIsMenuOpen(false)}>
                        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white w-full py-3 font-semibold shadow-lg">
                          Destacar Meus Cavalos
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
  );
};

export default Header;