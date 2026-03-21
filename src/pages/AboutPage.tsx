import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AboutPage = () => {
  return (
    <div className="bg-white min-h-screen">

      {/* ═══════════════════════════════════════════════════════════
          SEÇÃO 1 — O que é a Vitrine do Cavalo
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-16 items-start">

            {/* Coluna de texto */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1a2a5e] uppercase tracking-tight mb-8">
                O que é a Vitrine do Cavalo
              </h1>

              <div className="text-slate-600 text-base sm:text-[17px] leading-relaxed sm:leading-[1.9] space-y-5">
                <p>
                  A <strong className="text-slate-900">Vitrine do Cavalo</strong> é uma <strong className="text-slate-900">plataforma digital criada para valorizar e apresentar cavalos de raça</strong> com o padrão que eles realmente merecem.
                </p>

                <p>
                  Mais do que um espaço de divulgação, somos uma <strong className="text-slate-900">vitrine estratégica</strong> que conecta criadores, haras e profissionais do meio equestre a uma audiência qualificada, elevando a forma como os animais são vistos no ambiente digital.
                </p>

                <p>
                  Aqui, cada cavalo é apresentado com <strong className="text-slate-900">atenção aos detalhes, qualidade visual e posicionamento</strong>, transformando sua exposição em valor percebido.
                </p>

                <p>
                  Não realizamos vendas nem intermediações. Nosso propósito é <strong className="text-slate-900">dar visibilidade, fortalecer a imagem dos criadores</strong> e contribuir para a valorização da genética e do trabalho desenvolvido nos haras brasileiros.
                </p>
              </div>
            </div>

            {/* Coluna visual */}
            <div className="hidden lg:flex flex-col gap-6 sticky top-24">
              <div className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-[#1a2a5e] to-[#0f1f45] aspect-[4/5] flex flex-col items-center justify-end p-8 relative">
                <div className="absolute inset-0 opacity-10">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="about-dots-1" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="10" cy="10" r="1" fill="white" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#about-dots-1)" />
                  </svg>
                </div>
                <div className="relative text-center text-white">
                  <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-4">
                    <img
                      src="/logo.png.png"
                      alt="Logo Vitrine do Cavalo"
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                  <h3 className="text-xl font-bold">Vitrine do Cavalo</h3>
                  <p className="text-blue-200 text-sm mt-1">Plataforma do Mercado Equestre</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Divisor */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <hr className="border-slate-100" />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SEÇÃO 2 — Nossa História (2 colunas: texto + visual)
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-16 items-start">

            {/* Coluna de texto */}
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1a2a5e] uppercase tracking-tight mb-8">
                Nossa História
              </h2>

              <div className="text-slate-600 text-base sm:text-[17px] leading-relaxed sm:leading-[1.9] space-y-5">
                <p>
                  A <strong className="text-slate-900">Vitrine do Cavalo</strong> foi idealizada por{' '}
                  <strong className="text-slate-900">Rodrigo Tourinho</strong> e{' '}
                  <strong className="text-slate-900">Virgílio Tourinho</strong>, profissionais que vivem, na prática, o dia a dia do mercado equestre.
                </p>

                <p>
                  <strong className="text-slate-900">Rodrigo Tourinho</strong> é proprietário do{' '}
                  <strong className="text-slate-900">Haras Tourinho</strong> desde 2017, sendo um criador reconhecido na raça{' '}
                  <strong className="text-slate-900">Mangalarga Marchador</strong> e responsável por iniciativas relevantes no setor, como a{' '}
                  <strong className="text-slate-900">Copa de Marcha Haras Tourinho</strong>.
                </p>

                <p>
                  Também atuou como diretor na{' '}
                  <strong className="text-slate-900">Associação dos Criadores do Cavalo Mangalarga Marchador da Bahia</strong>, na gestão iniciada em 2022, fortalecendo ainda mais sua atuação e relacionamento dentro do meio.
                </p>

                <p>
                  <strong className="text-slate-900">Virgílio Tourinho</strong> atua diretamente na conexão entre criadores e interessados, com experiência na{' '}
                  <strong className="text-slate-900">divulgação e no relacionamento no mercado</strong>, acompanhando de perto as demandas e dificuldades enfrentadas por quem busca informação, visibilidade e oportunidades nesse segmento.
                </p>
              </div>
            </div>

            {/* Coluna visual */}
            <div className="hidden lg:flex flex-col gap-6 sticky top-24">
              <div className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-[#1a2a5e] to-[#0f1f45] aspect-[4/5] flex flex-col items-center justify-end p-8 relative">
                <div className="absolute inset-0 opacity-10">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="about-dots" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="10" cy="10" r="1" fill="white" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#about-dots)" />
                  </svg>
                </div>
                <div className="relative text-center text-white">
                  <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-4">
                    <img
                      src="/logo.png.png"
                      alt="Logo Vitrine do Cavalo"
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                  <h3 className="text-xl font-bold">Vitrine do Cavalo</h3>
                  <p className="text-blue-200 text-sm mt-1">Plataforma do Mercado Equestre</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SEÇÃO 3 — CTA final
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#1a2a5e] to-[#0f1f45] relative overflow-hidden">
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
