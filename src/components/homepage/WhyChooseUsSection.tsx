import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Image, Users, ArrowRight, Shield } from 'lucide-react';

const features = [
  {
    icon: Eye,
    title: 'Seu plantel visível para todo o Brasil',
    description:
      'Criadores, compradores e entusiastas encontram seus animais 24h por dia, em qualquer estado.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Image,
    title: 'Cada animal apresentado como merece',
    description:
      'Galeria profissional, genealogia de até 4 gerações, títulos e ficha completa — tudo em um perfil.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: Users,
    title: 'Conexão direta com quem importa',
    description:
      'Rankings por raça, busca avançada, mapa de criadores e contato direto — seu haras encontrado pelas pessoas certas.',
    color: 'bg-amber-100 text-amber-700',
  },
];

const WhyChooseUsSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="w-full relative py-12 sm:py-16 lg:py-20">
      <div className="container-responsive">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left — Text Block */}
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full inline-block" />
              Por que criadores escolhem a Vitrine
            </p>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
              Não é só divulgação.{' '}
              <span className="text-blue-600 relative inline-block">
                É posicionamento.
                <svg
                  className="absolute -bottom-1 left-0 w-full h-2 text-blue-600/30"
                  viewBox="0 0 200 8"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M0,4 Q50,0 100,4 T200,4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                </svg>
              </span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Cada animal é apresentado com atenção aos detalhes, transformando
              exposição em valor percebido para o seu haras.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/sobre')}
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full transition-all duration-200 shadow-md hover:shadow-lg min-h-[44px]"
              >
                Conheça a plataforma
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 font-semibold px-6 py-3 rounded-full transition-all duration-200 min-h-[44px]"
              >
                Criar conta gratuita
              </button>
            </div>
          </div>

          {/* Right — Feature Cards */}
          <div className="space-y-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:shadow-md group"
              >
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${feature.color}`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-base sm:text-lg mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
