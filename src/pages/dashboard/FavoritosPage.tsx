import React, { useState } from 'react';
import { Heart, Search, Filter, Star, MapPin, Eye, Trash2, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Link } from 'react-router-dom';
import mangalargaImg from '@/assets/mangalarga.jpg';
import thoroughbredImg from '@/assets/thoroughbred.jpg';
import quarterHorseImg from '@/assets/quarter-horse.jpg';

const FavoritosPage = () => {
  const { user } = useAuth();
  const { favorites: favoriteAnimals, removeFromFavorites, isLoading } = useFavorites();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBreed, setFilterBreed] = useState('all');
  const [removingAnimalId, setRemovingAnimalId] = useState<string | null>(null);

  const getImageSrc = (imageSrc: string) => {
    // Se tiver URL do Supabase Storage, usa ela
    if (imageSrc && imageSrc.startsWith('http')) {
      return imageSrc;
    }
    
    // Fallback para imagens placeholder
    switch (imageSrc) {
      case 'mangalarga': return mangalargaImg;
      case 'thoroughbred': return thoroughbredImg;
      case 'quarter-horse': return quarterHorseImg;
      default: return mangalargaImg;
    }
  };

  // Filter animals based on search and breed
  const filteredAnimals = favoriteAnimals.filter(animal => {
    const matchesSearch = animal.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBreed = filterBreed === 'all' || animal.breed === filterBreed;
    return matchesSearch && matchesBreed;
  });

  // Get unique breeds for filter
  const breeds = ['all', ...new Set(favoriteAnimals.map(animal => animal.breed))];

  const handleRemoveFavorite = async (id: string) => {
    // Marca o animal como sendo removido para animação
    setRemovingAnimalId(id);
    
    // Remove o animal da lista após a animação
    setTimeout(async () => {
      await removeFromFavorites(id);
      setRemovingAnimalId(null);
    }, 300); // Duração da animação
  };

  return (
    <ProtectedRoute>
      <DashboardPageWrapper 
        title="Favoritos"
        subtitle="Seus animais favoritos"
      >
        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Professional Filters Sidebar */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                <Filter className="h-6 w-6 mr-3 text-blue-600" />
                Filtros
              </h2>
              
              <div className="space-y-6">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Nome do animal..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    />
                  </div>
                </div>

                {/* Breed Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Raça</label>
                  <Select value={filterBreed} onValueChange={setFilterBreed}>
                    <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                      <SelectValue placeholder="Selecione uma raça" />
                    </SelectTrigger>
                    <SelectContent>
                      {breeds.map(breed => (
                        <SelectItem key={breed} value={breed}>
                          {breed === 'all' ? 'Todas as raças' : breed}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-xl font-semibold transition-all duration-300"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterBreed('all');
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>

            {/* Professional Stats */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Estatísticas</h2>
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Total de Favoritos</span>
                    <span className="text-slate-500 font-bold text-lg">{favoriteAnimals.length}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-pink-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Machos</span>
                    <span className="text-blue-600 font-bold text-lg">
                      {favoriteAnimals.filter(a => a.gender === 'Macho').length}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${favoriteAnimals.length > 0 ? (favoriteAnimals.filter(a => a.gender === 'Macho').length / favoriteAnimals.length) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Fêmeas</span>
                    <span className="text-pink-600 font-bold text-lg">
                      {favoriteAnimals.filter(a => a.gender === 'Fêmea').length}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-pink-600 h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${favoriteAnimals.length > 0 ? (favoriteAnimals.filter(a => a.gender === 'Fêmea').length / favoriteAnimals.length) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Breed Statistics */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800">Por Raça</h3>
                  
                  {breeds.filter(breed => breed !== 'all').map(breed => (
                    <div key={breed} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-700">{breed}</span>
                        <span className="text-blue-600 font-bold text-lg">
                          {favoriteAnimals.filter(a => a.breed === breed).length}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${favoriteAnimals.length > 0 ? (favoriteAnimals.filter(a => a.breed === breed).length / favoriteAnimals.length) * 100 : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Clean Main Content */}
          <div className="lg:col-span-3">
            {/* Loading State */}
            {isLoading ? (
              <div className="bg-white rounded-3xl p-16 shadow-xl border border-slate-200">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="text-slate-600 text-lg">Carregando seus favoritos...</p>
                </div>
              </div>
            ) : filteredAnimals.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 shadow-xl border border-slate-200 text-center">
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                    <Heart className="h-10 w-10 text-pink-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {searchTerm || filterBreed !== 'all'
                      ? 'Nenhum favorito encontrado' 
                      : 'Nenhum animal favorito ainda'
                    }
                  </h3>
                  <p className="text-lg text-slate-600 max-w-md mx-auto">
                    {searchTerm || filterBreed !== 'all'
                      ? 'Tente ajustar os filtros para encontrar seus animais favoritos.'
                      : 'Adicione animais aos seus favoritos para acompanhá-los facilmente.'
                    }
                  </p>
                  <Link to="/buscar">
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Search className="h-5 w-5 mr-2" />
                      Explorar Animais
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAnimals.map((animal) => (
                  <Link 
                    key={animal.id}
                    to={`/animal/${animal.id}`}
                    className={`bg-white rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden flex flex-col ${
                      removingAnimalId === animal.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                    }`}
                  >
                    {/* Image Section */}
                    <div className="relative">
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={getImageSrc(animal.image)}
                          alt={animal.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      {/* Heart Icon in top right corner */}
                      <div className="absolute top-3 right-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border-white/50 hover:bg-white hover:border-red-300 shadow-lg transition-all duration-300"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveFavorite(animal.id);
                          }}
                          title="Remover dos favoritos"
                        >
                          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 flex flex-col flex-grow">
                      {/* Animal Name */}
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {animal.name}
                      </h3>
                      
                      {/* Specifications */}
                      <p className="text-slate-600 text-sm mb-3">
                        {animal.breed} • {animal.age} anos • {animal.coat}
                      </p>
                      
                      {/* Gender */}
                      <p className={`font-semibold text-sm mb-4 ${
                        animal.gender === 'Macho' 
                          ? 'text-blue-600' 
                          : 'text-pink-600'
                      }`}>
                        {animal.gender === 'Macho' ? '♂ Macho' : '♀ Fêmea'}
                      </p>
                        
                      {/* Titles */}
                      {animal.titles && animal.titles.length > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span className="text-yellow-600 font-semibold text-sm bg-yellow-50 px-2 py-1 rounded-full">
                            {animal.titles[0]}
                          </span>
                        </div>
                      )}

                      {/* Spacer to push content to bottom */}
                      <div className="flex-grow"></div>

                      {/* Bottom Section - Always at bottom */}
                      <div className="space-y-3 mt-auto">
                        {/* Location */}
                        <p className="text-slate-500 text-sm">
                          {animal.location}
                        </p>
                        
                        {/* Haras */}
                        <p className="text-sm font-medium text-blue-600">
                          {animal.harasName}
                        </p>
                        
                        {/* Action Badge */}
                        <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold text-sm py-2 px-4 border border-slate-200 rounded-xl group-hover:border-blue-500 group-hover:text-blue-700 transition-all duration-300">
                          <Eye className="h-4 w-4" />
                          <span>Ver Detalhes</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardPageWrapper>
    </ProtectedRoute>
  );
};

export default FavoritosPage;