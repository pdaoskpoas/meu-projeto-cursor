import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Image, Users, ArrowRight, X, Check } from 'lucide-react';

const features = [
  {
    icon: Eye,
    title: 'Seus animais vistos todos os dias',
    description:
      'Seu plantel acessível 24h, em qualquer estado, sem precisar divulgar em grupos ou redes sociais.',
    iconClass: 'bg-blue-600 text-white shadow-md shadow-blue-600/25',
  },
  {
    icon: Image,
    title: 'Apresentação que valoriza seu plantel',
    description:
      'Galeria, genealogia de até 4 gerações, títulos e ficha completa. Um padrão que mostra a seriedade do seu trabalho.',
    iconClass: 'bg-blue-600 text-white shadow-md shadow-blue-600/25',
  },
  {
    icon: Users,
    title: 'Seu haras acessado por quem se interessa',
    description:
      'Busca avançada, mapa de haras e contato direto. Quem acompanha o setor equestre vai encontrar você.',
    iconClass: 'bg-slate-800 text-white shadow-md shadow-slate-800/20',
  },
];

const notList = ['Venda de animais', 'Intermediação', 'Comissões'];
const doList = [
  'Exposição contínua dos animais',
  'Visualizações reais na plataforma',
  'Reconhecimento para seu haras',
];

const WhyChooseUsSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="w-full relative py-10 sm:py-16 lg:py-20 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-blue-500/6 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative container-responsive">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-center">

          {/* Left — Text Block */}
          <div className="space-y-5 sm:space-y-7">

            {/* Eyebrow */}
            <div className="flex items-center gap-3">
              <span className="w-6 h-px bg-blue-600/30 inline-block flex-shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-semibold text-blue-600 tracking-[0.15em] sm:tracking-[0.22em] uppercase leading-none">
                Por que criadores escolhem a Vitrine
              </span>
            </div>

            {/* Headline + subheadline */}
            <div className="space-y-2.5 sm:space-y-3">
              <h2 className="text-[1.6rem] sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                Seu cavalo não precisa{' '}
                <span className="text-blue-600">estar à venda para ser visto.</span>
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-slate-500 leading-relaxed max-w-lg">
                Cadastre seus animais e ganhe exposição contínua. Seu haras
                acessado por quem se interessa pelo setor.
              </p>
            </div>

            {/* Objection block — always 2 cols side by side */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="grid grid-cols-2">
                {/* Not column */}
                <div className="p-4 sm:p-5 bg-slate-50">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Não fazemos
                  </p>
                  <ul className="space-y-2.5">
                    {notList.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                          <X className="h-2.5 w-2.5 text-red-400" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Do column — filled blue */}
                <div className="p-4 sm:p-5 bg-blue-600">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-blue-200 mb-3">
                    O que você ganha
                  </p>
                  <ul className="space-y-2.5">
                    {doList.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs sm:text-sm text-white">
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/planos')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 sm:py-3 rounded-full transition-all duration-200 shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/30 text-sm sm:text-base min-h-[48px] sm:min-h-[44px]"
              >
                Comece agora
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/sobre')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/50 text-slate-700 hover:text-blue-600 font-semibold px-6 py-3.5 sm:py-3 rounded-full transition-all duration-200 text-sm sm:text-base min-h-[48px] sm:min-h-[44px] shadow-sm"
              >
                Ver como funciona
              </button>
            </div>
          </div>

          {/* Right — Feature Cards */}
          <div className="space-y-2.5 sm:space-y-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 sm:gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 group"
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${feature.iconClass}`}
                >
                  <feature.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base lg:text-lg mb-0.5 sm:mb-1 group-hover:text-blue-600 transition-colors duration-200 leading-snug">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-base text-slate-500 leading-relaxed">
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
