import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Image, Users, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: Eye,
    title: 'Visibilidade para seus animais',
    description:
      'Seu plantel exposto para criadores, compradores e entusiastas de todo o Brasil, 24 horas por dia.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Image,
    title: 'Apresentação com padrão profissional',
    description:
      'Galeria de fotos, genealogia de até 4 gerações, títulos conquistados e ficha completa — cada animal apresentado com a qualidade que merece.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: Users,
    title: 'Conexão com o mercado equestre',
    description:
      'Rankings por raça, busca com filtros avançados, mapa de criadores e contato direto — seu haras encontrado pelas pessoas certas.',
    color: 'bg-slate-100 text-slate-700',
  },
];

const WhyChooseUsSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="w-full relative bg-white py-12 sm:py-16 lg:py-20">
      <div className="container-responsive">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left — Text Block */}
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full inline-block" />
              Por que a Vitrine do Cavalo?
            </p>

            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-slate-900 leading-tight">
              Mais do que divulgação.{' '}
              <span className="text-blue-600 relative inline-block">
                Uma vitrine estratégica
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

            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
              Criada para valorizar cavalos de raça com o padrão que eles realmente
              merecem. Aqui, cada animal é apresentado com atenção aos detalhes e
              posicionamento, transformando exposição em valor percebido para o seu haras.
            </p>

            <button
              onClick={() => navigate('/sobre')}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full transition-all duration-200 shadow-md hover:shadow-lg min-h-[44px]"
            >
              Conheça a plataforma
              <ArrowRight className="h-4 w-4" />
            </button>
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
