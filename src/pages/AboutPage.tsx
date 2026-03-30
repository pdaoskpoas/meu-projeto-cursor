import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Trophy, Award, Users, Target, Eye, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AboutPage = () => {
  return (
    <div className="bg-white min-h-screen">

      {/* ═══════════════════════════════════════════════════════════
          SEÇÃO 1 — O que é a Vitrine do Cavalo
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Fundo gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#1a2a5e] to-[#0f1f45]" />
        <div className="absolute inset-0 opacity-[0.06]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="about-dots" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="12" cy="12" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#about-dots)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <div className="grid lg:grid-cols-[1fr_340px] gap-12 lg:gap-16 items-center">

            {/* Texto */}
            <div>
              <p className="text-blue-300 text-sm font-semibold uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-8 h-px bg-blue-400" />
                Sobre nós
              </p>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-white leading-tight mb-8">
                O que é a Vitrine do Cavalo
              </h1>

              <div className="space-y-5 text-base sm:text-[17px] leading-relaxed sm:leading-[1.85]">
                <p className="text-blue-100/80">
                  A <strong className="text-white font-semibold">Vitrine do Cavalo</strong> é uma{' '}
                  <strong className="text-white font-semibold">plataforma digital criada para valorizar e apresentar cavalos de raça</strong>{' '}
                  com o padrão que eles realmente merecem.
                </p>

                <p className="text-blue-100/80">
                  Mais do que um espaço de divulgação, somos uma{' '}
                  <strong className="text-white font-semibold">vitrine estratégica</strong>{' '}
                  que conecta criadores, haras e profissionais do meio equestre a uma audiência qualificada, elevando a forma como os animais são vistos no ambiente digital.
                </p>

                <p className="text-blue-100/80">
                  Aqui, cada cavalo é apresentado com{' '}
                  <strong className="text-white font-semibold">atenção aos detalhes, qualidade visual e posicionamento</strong>, transformando sua exposição em valor percebido.
                </p>

                <p className="text-blue-100/80">
                  Não realizamos vendas nem intermediações. Nosso propósito é{' '}
                  <strong className="text-white font-semibold">dar visibilidade, fortalecer a imagem dos criadores</strong>{' '}
                  e contribuir para a valorização da genética e do trabalho desenvolvido nos haras brasileiros.
                </p>
              </div>
            </div>

            {/* Card visual com logo */}
            <div className="hidden lg:flex flex-col items-center">
              <div className="w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/20 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-sm border border-white/10 aspect-[4/5] flex flex-col items-center justify-center p-8 relative">
                <div className="absolute inset-0 opacity-[0.05]">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="card-dots" width="16" height="16" patternUnits="userSpaceOnUse">
                        <circle cx="8" cy="8" r="0.8" fill="white" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#card-dots)" />
                  </svg>
                </div>

                <div className="relative text-center text-white">
                  <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-5">
                    <img
                      src="/logo.png.png"
                      alt="Logo Vitrine do Cavalo"
                      className="w-14 h-14 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                  <h3 className="text-2xl font-bold">Vitrine do Cavalo</h3>
                  <p className="text-blue-200/70 text-sm mt-2 font-medium tracking-wide">Plataforma do Mercado Equestre</p>
                </div>
              </div>
            </div>

            {/* Logo card mobile — versão compacta */}
            <div className="lg:hidden flex justify-center">
              <div className="inline-flex items-center gap-4 bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4">
                <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <img
                    src="/logo.png.png"
                    alt="Logo Vitrine do Cavalo"
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="text-white">
                  <h3 className="text-lg font-bold">Vitrine do Cavalo</h3>
                  <p className="text-blue-200/70 text-xs font-medium tracking-wide">Plataforma do Mercado Equestre</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SEÇÃO 2 — Nossa História
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Cabeçalho da seção */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-end mb-12 sm:mb-16 pb-12 sm:pb-16 border-b border-slate-100">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 flex items-center gap-2 mb-4">
                <span className="w-1 h-5 bg-blue-600 rounded-full inline-block" />
                Nossa História
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                Criada por quem vive o{' '}
                <span className="text-blue-600">mercado equestre na prática.</span>
              </h2>
            </div>

            <div>
              <p className="text-slate-500 text-base sm:text-lg leading-relaxed">
                A Vitrine do Cavalo foi idealizada por{' '}
                <strong className="text-slate-800">Rodrigo Tourinho</strong> e{' '}
                <strong className="text-slate-800">Virgílio Tourinho</strong>, profissionais que vivem, na prática, o dia a dia do mercado equestre.
              </p>
            </div>
          </div>

          {/* Cards dos fundadores */}
          <div className="flex flex-col gap-6 sm:gap-8">

            {/* Card Rodrigo */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row">
              <div className="md:w-2/5 h-64 md:h-auto overflow-hidden flex-shrink-0">
                <img
                  src="/rodrigo.JPG"
                  alt="Rodrigo Tourinho"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              <div className="p-6 sm:p-8 flex flex-col justify-center">
                <div className="mb-5">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Rodrigo Tourinho</h3>
                  <p className="text-blue-600 font-medium text-sm mt-1">Cofundador</p>
                </div>

                <p className="text-slate-500 text-[15px] leading-relaxed mb-5">
                  Proprietário do <strong className="text-slate-700">Haras Tourinho</strong> desde 2017, sendo um criador reconhecido na raça{' '}
                  <strong className="text-slate-700">Mangalarga Marchador</strong> e responsável por iniciativas relevantes no setor, como a{' '}
                  <strong className="text-slate-700">Copa de Marcha Haras Tourinho</strong>.
                </p>

                <p className="text-slate-500 text-[15px] leading-relaxed mb-6">
                  Também atuou como diretor na{' '}
                  <strong className="text-slate-700">Associação dos Criadores do Cavalo Mangalarga Marchador da Bahia</strong>, na gestão iniciada em 2022, fortalecendo ainda mais sua atuação e relacionamento dentro do meio.
                </p>

                <div className="space-y-2.5">
                  {[
                    { icon: Building2, text: 'Haras Tourinho — desde 2017' },
                    { icon: Trophy, text: 'Copa de Marcha Haras Tourinho' },
                    { icon: Award, text: 'Ex-diretor da Associação MM da Bahia' },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-slate-700 text-sm font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card Virgílio */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row">
              <div className="md:w-2/5 h-64 md:h-auto overflow-hidden flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm">
                  <User className="w-10 h-10 text-slate-300" />
                </div>
              </div>

              <div className="p-6 sm:p-8 flex flex-col justify-center">
                <div className="mb-5">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Virgílio Tourinho</h3>
                  <p className="text-blue-600 font-medium text-sm mt-1">Cofundador</p>
                </div>

                <p className="text-slate-500 text-[15px] leading-relaxed mb-6">
                  Atua diretamente na conexão entre criadores e interessados, com experiência na{' '}
                  <strong className="text-slate-700">divulgação e no relacionamento no mercado</strong>, acompanhando de perto as demandas e dificuldades enfrentadas por quem busca informação, visibilidade e oportunidades nesse segmento.
                </p>

                <div className="space-y-2.5">
                  {[
                    { icon: Users, text: 'Relacionamento com criadores e mercado' },
                    { icon: Target, text: 'Divulgação estratégica no setor equestre' },
                    { icon: Eye, text: 'Visibilidade e oportunidades no segmento' },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-slate-700 text-sm font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CTA Final
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.03] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
            Faça parte dessa história
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/planos">
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-8 py-3 rounded-xl text-base h-auto">
                Conheça nossos planos
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to={{ pathname: "/ajuda", hash: "contato" }}>
              <Button
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white px-8 py-3 rounded-xl text-base h-auto"
              >
                Fale conosco
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutPage;
