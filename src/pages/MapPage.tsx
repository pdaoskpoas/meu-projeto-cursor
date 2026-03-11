import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, Globe2, Users2, Building2, Home, Heart, Award, MapPinned } from 'lucide-react';
import MapboxMap from '@/components/MapboxMap';
import UserMapPopup from '@/components/UserMapPopup';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/supabase';

const MapPage = () => {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Buscar usuários do Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_active', true)
          .eq('is_suspended', false);

        if (error) {
          console.error('Erro ao buscar usuários:', error);
          return;
        }

        setUsers(data || []);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // VIP users for highlights
  const vipUsers = users.filter(u => u.plan !== 'free').slice(0, 5);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a0a1f]">
      {/* Header - Substitui o banner de destaques */}
      <header className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/90 via-black/70 to-transparent backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl"></span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Vitrine do Cavalo</h1>
              <p className="text-blue-300 text-xs">Mapa da Comunidade</p>
            </div>
          </Link>

          {/* Quick Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              Início
            </Link>
            <Link to="/buscar" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              Buscar
            </Link>
            <Link to="/noticias" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              Notícias
            </Link>
            <Link to="/eventos" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              Eventos
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/login')}
              className="hidden sm:block px-4 py-2 text-white/90 hover:text-white transition-colors text-sm font-medium"
            >
              Entrar
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-semibold transition-all"
            >
              Cadastrar
            </button>
          </div>
        </div>
      </header>

      {/* Left Sidebar - Ícones customizados */}
      <div className="absolute left-0 top-0 bottom-0 z-20 w-16 bg-gradient-to-r from-[#1a1a3e]/95 via-[#1a1a3e]/80 to-transparent backdrop-blur-sm flex flex-col items-center py-20 gap-6">
        {/* Ícones verticais customizados */}
        <div className="flex-1 flex flex-col gap-6 mt-8">
          <button 
            className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center hover:bg-yellow-500/30 transition-all group relative"
            title="Membros VIP"
          >
            <Award className="h-5 w-5 text-yellow-400" />
            <span className="absolute left-14 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Membros VIP
            </span>
          </button>
          
          <button 
            className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center hover:bg-blue-500/30 transition-all group relative"
            title="Por Localização"
          >
            <MapPinned className="h-5 w-5 text-blue-400" />
            <span className="absolute left-14 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Por Localização
            </span>
          </button>
          
          <button 
            className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center hover:bg-green-500/30 transition-all group relative"
            title="Instituições"
          >
            <Building2 className="h-5 w-5 text-green-400" />
            <span className="absolute left-14 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Instituições
            </span>
          </button>

          <button 
            className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center hover:bg-pink-500/30 transition-all group relative"
            title="Favoritos"
          >
            <Heart className="h-5 w-5 text-pink-400" />
            <span className="absolute left-14 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Favoritos
            </span>
          </button>
        </div>

        {/* Home Button */}
        <Link 
          to="/"
          className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-all"
          title="Voltar ao Início"
        >
          <Home className="h-5 w-5 text-white" />
        </Link>
      </div>

      {/* Main Map - Full Screen */}
      <div className="absolute inset-0 z-10">
        {loading ? (
          <div className="absolute inset-0 bg-[#0a0a1f] flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-500/30 rounded-full"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-white text-lg">Carregando mapa da comunidade...</p>
              <p className="text-gray-400 text-sm">Localizando membros em todo o Brasil</p>
            </div>
          </div>
        ) : (
          <MapboxMap 
            users={users}
            onUserClick={setSelectedUser}
            className="h-full w-full"
          />
        )}
      </div>

      {/* Right Sidebar Toggle Button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-20 right-6 z-30 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all shadow-lg"
      >
        {sidebarOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Menu className="h-6 w-6 text-white" />
        )}
      </button>

      {/* Right Sidebar - Info Panel */}
      <div 
        className={`absolute top-0 right-0 bottom-0 w-full md:w-[500px] bg-gradient-to-l from-[#1a1a3e]/98 via-[#1a1a3e]/95 to-transparent backdrop-blur-xl z-20 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-3 pt-16">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-3xl"></span>
              </div>
              <h1 className="text-3xl font-bold text-white">Vitrine do Cavalo</h1>
            </div>
            <p className="text-gray-300 text-lg">Conecte-se com a comunidade equestre</p>
          </div>

          {/* Scroll Down Indicator */}
          <div className="flex flex-col items-center gap-2 opacity-60">
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
              <div className="w-1 h-3 bg-white/50 rounded-full animate-bounce"></div>
            </div>
            <p className="text-white/50 text-sm">Explore o mapa</p>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">Faça parte da comunidade!</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg"
              >
                Já sou membro • Entrar
              </button>
              <button 
                onClick={() => navigate('/register')}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-all"
              >
                <MapPinned className="h-4 w-4 inline mr-2" />
                Cadastrar e aparecer no mapa
              </button>
            </div>
            <p className="text-gray-400 text-sm text-center">
              Sua localização é baseada na cidade escolhida no cadastro
            </p>
          </div>

          {/* Info sobre localização */}
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-start gap-3">
              <MapPinned className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-white font-semibold mb-1">Como funciona a localização</h4>
                <p className="text-gray-300 text-sm">
                  Ao se cadastrar, você escolhe seu <strong>país, estado e cidade</strong>. 
                  Seu avatar aparecerá no mapa exatamente na localização escolhida.
                </p>
              </div>
            </div>
          </div>

          {/* Who's it for */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white">Para quem é?</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-gray-300">
                <span className="text-green-400 text-xl">✓</span>
                <p>Criadores que querem expandir networking</p>
              </div>
              <div className="flex items-start gap-3 text-gray-300">
                <span className="text-green-400 text-xl">✓</span>
                <p>Haras e fazendas que desejam visibilidade</p>
              </div>
              <div className="flex items-start gap-3 text-gray-300">
                <span className="text-green-400 text-xl">✓</span>
                <p>Entusiastas que querem conhecer criadores locais</p>
              </div>
              <div className="flex items-start gap-3 text-gray-400">
                <span className="text-red-400 text-xl">✗</span>
                <p>Não para spam ou coleta de dados</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{users.length}</div>
              <div className="text-gray-400 text-sm mt-1">Membros</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-400">
                {users.filter(u => u.plan !== 'free').length}
              </div>
              <div className="text-gray-400 text-sm mt-1">VIPs</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-400">
                {users.filter(u => u.account_type === 'institutional').length}
              </div>
              <div className="text-gray-400 text-sm mt-1">Haras</div>
            </div>
          </div>

          {/* Diferenças entre planos */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white">Planos no Mapa</h3>
            
            {/* Plano Free */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Users2 className="h-5 w-5 text-gray-400" />
                <h4 className="text-white font-semibold">Plano Free</h4>
              </div>
              <ul className="space-y-1 text-sm text-gray-300 ml-7">
                <li>• Avatar padrão com inicial do nome</li>
                <li>• Localização na cidade escolhida</li>
                <li>• Informações básicas no clique</li>
              </ul>
            </div>

            {/* Plano VIP */}
            <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-600/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-400" />
                <h4 className="text-white font-semibold">Planos VIP</h4>
              </div>
              <ul className="space-y-1 text-sm text-gray-200 ml-7">
                <li>• Logo personalizada visível</li>
                <li>• Instagram e redes sociais</li>
                <li>• Botão "Ver Perfil Completo"</li>
                <li>• Destaque no mapa</li>
              </ul>
            </div>
          </div>

          {/* Premium CTA */}
          <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Award className="h-6 w-6 text-yellow-400" />
              <h3 className="text-xl font-bold text-white">Destaque-se no Mapa</h3>
            </div>
            <p className="text-gray-300">
              Membros VIP têm logo personalizada, mais visibilidade e informações completas visíveis para todos.
            </p>
            <button 
              onClick={() => navigate('/planos')}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg"
            >
              Ver Planos VIP
            </button>
          </div>
        </div>
      </div>

      {/* User Popup */}
      {selectedUser && (
        <UserMapPopup
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onViewProfile={(userId) => {
            navigate(`/profile/${userId}`);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

export default MapPage;