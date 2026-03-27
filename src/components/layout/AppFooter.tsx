import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Instagram, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Accordion section — collapses on mobile, always open on desktop */
const FooterSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-700/40 lg:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 lg:py-0 lg:cursor-default lg:pointer-events-none"
      >
        <h4 className="text-base font-semibold text-white flex items-center">
          <span className="w-1 h-5 bg-blue-500 rounded-full mr-2" />
          {title}
        </h4>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 lg:hidden ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 lg:max-h-[500px] lg:opacity-100 lg:mt-4 ${
          open ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
};

const AppFooter: React.FC = () => {
  return (
    <footer className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950 text-white overflow-hidden w-full">
      {/* Padrão decorativo */}
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

      <div className="relative w-full py-10 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 lg:gap-10 mb-8 lg:mb-12">
          {/* Logo e redes sociais — sempre visível */}
          <div className="pb-6 mb-2 border-b border-slate-700/40 lg:border-0 lg:pb-0 lg:mb-0">
            <Link to="/" className="inline-block group mb-4">
              <div className="flex items-center space-x-3">
                <img
                  src="/logo.png.png"
                  alt="Logo Vitrine do Cavalo"
                  className="w-10 h-10 object-contain drop-shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div>
                  <h3 className="text-lg font-bold text-white">Vitrine do Cavalo</h3>
                  <div className="text-[10px] font-medium text-blue-400 tracking-widest uppercase">
                    Plataforma Premium
                  </div>
                </div>
              </div>
            </Link>

            <a
              href="https://www.instagram.com/vitrinedocavalo_br/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
              <span>@vitrinedocavalo_br</span>
            </a>
          </div>

          {/* Navegação — accordion no mobile */}
          <FooterSection title="Navegação">
            <ul className="space-y-2.5">
              {[
                { to: '/', label: 'Início' },
                { to: '/buscar', label: 'Buscar Animais' },
                { to: '/ranking', label: 'Ranking' },
                { to: '/eventos', label: 'Eventos' },
                { to: '/sobre', label: 'Sobre Nós' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-slate-300 hover:text-blue-400 transition-colors text-sm"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterSection>

          {/* Para Criadores */}
          <FooterSection title="Para Criadores">
            <ul className="space-y-2.5">
              {[
                { to: '/register', label: 'Criar Conta' },
                { to: '/planos', label: 'Planos Premium' },
                { to: '/dashboard/society', label: 'Sociedades' },
                { to: '/ajuda', label: 'Central de Ajuda' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-slate-300 hover:text-blue-400 transition-colors text-sm"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterSection>

          {/* Newsletter e contato */}
          <FooterSection title="Fique Conectado">
            <div className="space-y-3 mb-4">
              <p className="text-slate-400 text-sm">
                Novidades e oportunidades do mercado equestre.
              </p>
              <Input
                placeholder="Seu melhor e-mail"
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-11"
              />
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-11">
                Assinar Newsletter
              </Button>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-700/50">
              <a
                href="mailto:contato@vitrinedocavalo.com.br"
                className="flex items-center space-x-2 text-sm text-slate-400 hover:text-blue-400 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>contato@vitrinedocavalo.com.br</span>
              </a>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <MapPin className="w-3.5 h-3.5" />
                <span>Salvador, BA - Brasil</span>
              </div>
            </div>
          </FooterSection>
        </div>

        {/* Rodapé inferior */}
        <div className="pt-6 border-t border-slate-700/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-slate-500 text-xs">
              © 2024 <span className="text-blue-400/80">Vitrine do Cavalo</span>. Todos os direitos reservados.
            </p>
            <div className="flex gap-4">
              <Link to="/terms" className="text-slate-500 hover:text-blue-400 transition-colors text-xs">
                Termos de Uso
              </Link>
              <Link to="/privacy" className="text-slate-500 hover:text-blue-400 transition-colors text-xs">
                Privacidade
              </Link>
              <Link
                to={{ pathname: '/ajuda', hash: 'contato' }}
                className="text-slate-500 hover:text-blue-400 transition-colors text-xs"
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
