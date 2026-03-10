import React from 'react';
import { Users, Award, Globe, Shield, CheckCircle, TrendingUp, Zap, Target, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const FeaturesSection = () => {
  return (
    <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50 py-24">
      <div className="container-responsive">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-2 bg-blue-100 px-4 py-2 rounded-full">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800 font-semibold">Soluções Profissionais</span>
            </div>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
            A Vitrine que Seus Cavalos
            <span className="block text-blue-700">
              Sempre Mereceram
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
            Criamos a plataforma perfeita para que cavalos excepcionais sejam descobertos 
            e admirados por verdadeiros conhecedores em todo o Brasil
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 mb-20">
          {/* Para Criadores - Enhanced */}
          <div className="group hover:bg-white hover:shadow-2xl rounded-3xl p-8 transition-all duration-500 border border-transparent hover:border-blue-100">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Building className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Seus Cavalos em Evidência
                </h3>
                <p className="text-slate-600 leading-relaxed mb-8">
                  Transforme cavalos talentosos mas desconhecidos em referências admiradas. 
                  Sua vitrine profissional com alcance nacional para quem merece ser visto.
                </p>
              </div>
              <div className="space-y-4 text-left">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Exposição Profissional</div>
                    <div className="text-slate-600 text-sm">Perfis elegantes que destacam qualidades únicas</div>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Alcance Nacional</div>
                    <div className="text-slate-600 text-sm">Seus cavalos vistos em todo o Brasil</div>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Reconhecimento Merecido</div>
                    <div className="text-slate-600 text-sm">Conecte com verdadeiros admiradores</div>
                  </div>
                </div>
              </div>
              <Link to="/register" className="block pt-4">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300">
                  Destacar Meus Cavalos
                </Button>
              </Link>
            </div>
          </div>

          {/* Para Compradores - Enhanced */}
          <div className="group hover:bg-white hover:shadow-2xl rounded-3xl p-8 transition-all duration-500 border border-transparent hover:border-emerald-100">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Descobrir Talentos Únicos
                </h3>
                <p className="text-slate-600 leading-relaxed mb-8">
                  Encontre cavalos extraordinários que ainda não são conhecidos pelo grande público. 
                  Descubra joias raras antes que se tornem famosas.
                </p>
              </div>
              <div className="space-y-4 text-left">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Descoberta Inteligente</div>
                    <div className="text-slate-600 text-sm">Encontre talentos por raça, região e características</div>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Perfis Detalhados</div>
                    <div className="text-slate-600 text-sm">Histórico completo e linhagem documentada</div>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Conexão Direta</div>
                    <div className="text-slate-600 text-sm">Converse diretamente com os criadores</div>
                  </div>
                </div>
              </div>
              <Link to="/dashboard" className="block pt-4">
                <Button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300">
                  Descobrir Talentos
                </Button>
              </Link>
            </div>
          </div>

          {/* Cobertura Nacional - Enhanced */}
          <div className="group hover:bg-white hover:shadow-2xl rounded-3xl p-8 transition-all duration-500 border border-transparent hover:border-purple-100">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Globe className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Comunidade Nacional
                </h3>
                <p className="text-slate-600 leading-relaxed mb-8">
                  Faça parte da maior comunidade de admiradores de cavalos do Brasil. 
                  Conecte-se com pessoas que compartilham sua paixão por toda extensão nacional.
                </p>
              </div>
              <div className="space-y-4 text-left">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Brasil Inteiro</div>
                    <div className="text-slate-600 text-sm">Cavalos de 23 estados em uma só plataforma</div>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">156+ Criadores</div>
                    <div className="text-slate-600 text-sm">Comunidade ativa de apaixonados</div>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">12M+ Admirações</div>
                    <div className="text-slate-600 text-sm">Milhões de pessoas descobrindo talentos</div>
                  </div>
                </div>
              </div>
              <Link to="/buscar" className="block pt-4">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300">
                  Explorar Animais
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Call to Action Final */}
        <div className="text-center bg-gradient-to-r from-slate-900 to-blue-900 rounded-3xl p-12 text-white">
          <h3 className="text-3xl font-bold mb-4">Seus Cavalos Merecem Ser Admirados</h3>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Transforme talentos desconhecidos em referências nacionais. 
            Dê a seus cavalos a visibilidade que eles sempre mereceram.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 min-w-[200px]">
                Destacar Meus Cavalos
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-slate-900 px-8 py-4 text-lg font-semibold transition-all duration-300 min-w-[200px]">
                Descobrir Talentos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
