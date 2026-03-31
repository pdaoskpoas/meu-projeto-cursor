import React from 'react';
import { Shield, Award, TrendingUp, Users, MapPin, Star, CheckCircle, Calendar } from 'lucide-react';

const StatsSection = () => {
  return (
    <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-20 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent"></div>
      </div>
      
      <div className="container-responsive relative">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-2 bg-blue-600/20 px-4 py-2 rounded-full">
              <Shield className="h-5 w-5 text-blue-400" />
              <span className="text-blue-300 font-semibold">Plataforma Líder no Mercado</span>
            </div>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            A Vitrine que Transforma
            <span className="block text-blue-300">
              Cavalos em Referências
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Milhões de pessoas descobrindo e admirando cavalos extraordinários 
            que merecem reconhecimento em todo o Brasil
          </p>
        </div>
        
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Award className="h-8 w-8 text-white" />
            </div>
            <div className="text-4xl sm:text-5xl font-bold text-blue-300 mb-2">
              847
            </div>
            <div className="text-lg font-semibold text-white mb-1">
              Cavalos em Destaque
            </div>
            <div className="text-sm text-slate-300">
              Talentos Descobertos e Admirados
            </div>
          </div>
          
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div className="text-4xl sm:text-5xl font-bold text-blue-300 mb-2">
              156+
            </div>
            <div className="text-lg font-semibold text-white mb-1">
              Criadores Ativos
            </div>
            <div className="text-sm text-slate-300">
              Apaixonados Compartilhando Talentos
            </div>
          </div>
          
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <MapPin className="h-8 w-8 text-white" />
            </div>
            <div className="text-4xl sm:text-5xl font-bold text-blue-300 mb-2">
              23
            </div>
            <div className="text-lg font-semibold text-white mb-1">
              Estados Alcançados
            </div>
            <div className="text-sm text-slate-300">
              Vitrine de Costa a Costa
            </div>
          </div>
          
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div className="text-4xl sm:text-5xl font-bold text-gray-200 mb-2">
              12M+
            </div>
            <div className="text-lg font-semibold text-white mb-1">
              Admirações Mensais
            </div>
            <div className="text-sm text-slate-300">
              Pessoas Descobrindo Talentos
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-white/20">
          <h3 className="text-2xl lg:text-3xl font-bold text-center mb-8">Por Que Somos a Escolha dos Profissionais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">100% Verificado</h4>
                <p className="text-slate-300 text-sm">Todos os haras passam por processo rigoroso de verificação documental</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Rede Premium</h4>
                <p className="text-slate-300 text-sm">Conectamos apenas criadores e compradores qualificados do mercado</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Avaliação 5.0</h4>
                <p className="text-slate-300 text-sm">Nota máxima de satisfação entre nossos usuários profissionais</p>
              </div>
            </div>
          </div>
        </div>

        {/* Market Leadership */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600/20 to-blue-800/20 px-6 py-3 rounded-full border border-blue-400/30">
            <Calendar className="h-5 w-5 text-blue-400" />
            <span className="text-blue-300 font-semibold">Líderes desde 2018 no mercado digital equestre</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
