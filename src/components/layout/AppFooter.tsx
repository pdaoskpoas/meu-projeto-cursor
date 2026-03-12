import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const AppFooter: React.FC = () => {
  return (
    <footer className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950 text-white overflow-hidden w-full">
      {/* Padrão decorativo de fundo */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="footer-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1.5" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-pattern)" />
        </svg>
      </div>

      <div className="relative w-full py-12 sm:py-14 lg:py-16 px-4 sm:px-6 lg:px-8">
        {/* Seção Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-12">
          
          {/* Logo e Descrição */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block group mb-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img 
                    src="/logo.png.png" 
                    alt="Logo Vitrine do Cavalo"
                    className="w-12 h-12 object-contain drop-shadow-lg group-hover:scale-105 transition-all duration-300"
                    onError={(e) => {
                      // Fallback se a imagem não carregar
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                    Vitrine do Cavalo
                  </h3>
                  <div className="text-xs font-medium text-slate-300 tracking-wide">
                    PLATAFORMA PREMIUM
                  </div>
                </div>
              </div>
            </Link>
            
            {/* Redes Sociais */}
            <div className="flex items-center space-x-3">
              <a 
                href="#" 
                className="w-11 h-11 sm:w-9 sm:h-9 bg-slate-700/50 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 sm:w-4 sm:h-4" />
              </a>
              <a 
                href="#" 
                className="w-11 h-11 sm:w-9 sm:h-9 bg-slate-700/50 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 sm:w-4 sm:h-4" />
              </a>
              <a 
                href="#" 
                className="w-11 h-11 sm:w-9 sm:h-9 bg-slate-700/50 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 sm:w-4 sm:h-4" />
              </a>
            </div>
          </div>

          {/* Navegação */}
          <div>
            <h4 className="text-base font-semibold mb-4 text-white flex items-center">
              <span className="w-1 h-5 bg-blue-500 rounded-full mr-2"></span>
              Navegação
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link 
                  to="/" 
                  className="text-slate-300 hover:text-blue-400 transition-colors text-sm inline-flex items-center group"
                >
                  <span className="w-0 group-hover:w-2 h-px bg-blue-400 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                  Início
                </Link>
              </li>
              <li>
                <Link 
                  to="/buscar" 
                  className="text-slate-300 hover:text-blue-400 transition-colors text-sm inline-flex items-center group"
                >
                  <span className="w-0 group-hover:w-2 h-px bg-blue-400 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                  Cavalos em Destaque
                </Link>
              </li>
              <li>
                <Link 
                  to="/buscar" 
                  className="text-slate-300 hover:text-blue-400 transition-colors text-sm inline-flex items-center group"
                >
                  <span className="w-0 group-hover:w-2 h-px bg-blue-400 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                  Buscar Animais
                </Link>
              </li>
              <li>
                <Link 
                  to="/ranking" 
                  className="text-slate-300 hover:text-blue-400 transition-colors text-sm inline-flex items-center group"
                >
                  <span className="w-0 group-hover:w-2 h-px bg-blue-400 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                  Ranking Histórico
                </Link>
              </li>
            </ul>
          </div>

          {/* Para Criadores */}
          <div>
            <h4 className="text-base font-semibold mb-4 text-white flex items-center">
              <span className="w-1 h-5 bg-blue-500 rounded-full mr-2"></span>
              Para Criadores
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link 
                  to="/register" 
                  className="text-slate-300 hover:text-blue-400 transition-colors text-sm inline-flex items-center group"
                >
                  <span className="w-0 group-hover:w-2 h-px bg-blue-400 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                  Criar Conta
                </Link>
              </li>
              <li>
                <Link 
                  to="/planos" 
                  className="text-slate-300 hover:text-blue-400 transition-colors text-sm inline-flex items-center group"
                >
                  <span className="w-0 group-hover:w-2 h-px bg-blue-400 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                  Planos Premium
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard/society" 
                  className="text-slate-300 hover:text-blue-400 transition-colors text-sm inline-flex items-center group"
                >
                  <span className="w-0 group-hover:w-2 h-px bg-blue-400 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                  Sociedades
                </Link>
              </li>
              <li>
                <Link 
                  to="/ajuda" 
                  className="text-slate-300 hover:text-blue-400 transition-colors text-sm inline-flex items-center group"
                >
                  <span className="w-0 group-hover:w-2 h-px bg-blue-400 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                  Central de Ajuda
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter e Contato */}
          <div>
            <h4 className="text-base font-semibold mb-4 text-white flex items-center">
              <span className="w-1 h-5 bg-blue-500 rounded-full mr-2"></span>
              Fique Conectado
            </h4>
            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
              Receba novidades e oportunidades exclusivas do mercado equestre.
            </p>
            
            <div className="space-y-3 mb-6">
              <Input 
                placeholder="Seu melhor e-mail"
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg hover:shadow-blue-500/50 transition-all duration-300">
                Assinar Newsletter
              </Button>
            </div>

            {/* Contato */}
            <div className="space-y-2.5 pt-4 border-t border-slate-700">
              <a 
                href="mailto:contato@vitrinedocavalo.com.br" 
                className="flex items-center space-x-2 text-sm text-slate-300 hover:text-blue-400 transition-colors group"
              >
                <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>contato@vitrinedocavalo.com.br</span>
              </a>
              <div className="flex items-center space-x-2 text-sm text-slate-300">
                <MapPin className="w-4 h-4" />
                <span>São Paulo, SP - Brasil</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé Inferior */}
        <div className="pt-8 border-t border-slate-700/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-slate-400 text-xs sm:text-sm">
              © 2024 <span className="text-blue-400 font-medium">Vitrine do Cavalo</span>. Todos os direitos reservados.
            </p>
            <div className="flex flex-wrap gap-4 sm:gap-6">
              <Link 
                to="/terms" 
                className="text-slate-400 hover:text-blue-400 transition-colors text-xs sm:text-sm"
              >
                Termos de Uso
              </Link>
              <Link 
                to="/privacy" 
                className="text-slate-400 hover:text-blue-400 transition-colors text-xs sm:text-sm"
              >
                Privacidade
              </Link>
              <Link 
                to="/contact" 
                className="text-slate-400 hover:text-blue-400 transition-colors text-xs sm:text-sm"
              >
                Contato
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;