import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { HORSE_BREEDS } from '@/constants/breeds';
import { supabase } from '@/lib/supabase';

interface RankingFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedBreed: string;
  setSelectedBreed: (value: string) => void;
  selectedGender: string;
  setSelectedGender: (value: string) => void;
  selectedCategory: string;  // Novo filtro de categoria
  setSelectedCategory: (value: string) => void;  // Setter para categoria
  selectedProfile: string;
  setSelectedProfile: (value: string) => void;
  selectedState: string;
  setSelectedState: (value: string) => void;
  selectedCity: string;
  setSelectedCity: (value: string) => void;
  selectedAwarded: string;
  setSelectedAwarded: (value: string) => void;
  selectedRegistered: string;
  setSelectedRegistered: (value: string) => void;
  selectedAge: string;
  setSelectedAge: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  onClearFilters: () => void;
}

const RankingFilters: React.FC<RankingFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedBreed,
  setSelectedBreed,
  selectedGender,
  setSelectedGender,
  selectedCategory,
  setSelectedCategory,
  selectedProfile,
  setSelectedProfile,
  selectedState,
  setSelectedState,
  selectedCity,
  setSelectedCity,
  selectedAwarded,
  setSelectedAwarded,
  selectedRegistered,
  setSelectedRegistered,
  selectedAge,
  setSelectedAge,
  sortBy,
  setSortBy,
  onClearFilters
}) => {
  // Estado para controlar filtros colapsáveis no mobile
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Estados dinâmicos do banco
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // Buscar estados com anúncios ativos
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const { data, error } = await supabase
          .from('animals')
          .select('current_state')
          .eq('ad_status', 'active')
          .not('current_state', 'is', null);

        if (error) throw error;

        const uniqueStates = Array.from(new Set(
          data.map((item) => item.current_state).filter(Boolean)
        )).sort();

        setAvailableStates(uniqueStates);
      } catch (error) {
        console.error('Erro ao buscar estados:', error);
      }
    };

    fetchStates();
  }, []);

  // Buscar cidades com anúncios ativos (filtrado por estado se selecionado)
  useEffect(() => {
    const fetchCities = async () => {
      try {
        let query = supabase
          .from('animals')
          .select('current_city, current_state')
          .eq('ad_status', 'active')
          .not('current_city', 'is', null);

        if (selectedState !== 'all') {
          query = query.eq('current_state', selectedState);
        }

        const { data, error } = await query;

        if (error) throw error;

        const uniqueCities = Array.from(new Set(
          data.map((item) => item.current_city).filter(Boolean)
        )).sort();

        setAvailableCities(uniqueCities);
      } catch (error) {
        console.error('Erro ao buscar cidades:', error);
      }
    };

    fetchCities();
  }, [selectedState]);

  // Lista de raças oficiais
  const breeds = HORSE_BREEDS;

  const hasActiveFilters = searchTerm || 
    selectedBreed !== 'all' || 
    selectedGender !== 'all' || 
    selectedCategory !== 'all' || 
    selectedProfile !== 'all' || 
    selectedState !== 'all' || 
    selectedCity !== 'all' || 
    selectedAwarded !== 'all' || 
    selectedAge !== 'all' ||
    selectedRegistered !== 'all';

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
      {/* Header com toggle para mobile */}
      <button
        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
        className="w-full p-4 sm:p-6 flex items-center justify-between lg:cursor-default"
      >
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center">
          <Filter className="h-5 w-5 mr-2 text-blue-600" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-semibold rounded-full">
              {[searchTerm, selectedBreed !== 'all', selectedGender !== 'all', selectedCategory !== 'all', selectedProfile !== 'all', selectedState !== 'all', selectedCity !== 'all', selectedAwarded !== 'all', selectedAge !== 'all', selectedRegistered !== 'all'].filter(Boolean).length}
            </span>
          )}
        </h2>
        {/* Ícone apenas visível no mobile */}
        <div className="lg:hidden">
          {isFiltersOpen ? (
            <ChevronUp className="h-5 w-5 text-slate-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-600" />
          )}
        </div>
      </button>
      
      {/* Conteúdo dos filtros - colapsável no mobile, sempre aberto no desktop */}
      <div className={`space-y-4 px-4 pb-4 sm:px-6 sm:pb-6 ${isFiltersOpen ? 'block' : 'hidden'} lg:block`}>
        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Buscar</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Nome do animal ou haras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-10 sm:h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
            />
          </div>
        </div>

        {/* Breed Filter */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Raça</label>
          <Select value={selectedBreed} onValueChange={setSelectedBreed}>
            <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg">
              <SelectValue placeholder="Todas as raças" />
            </SelectTrigger>
            <SelectContent align="start" side="bottom" avoidCollisions={false}>
              <SelectItem value="all">Todas as raças</SelectItem>
              {breeds.map((breed) => (
                <SelectItem key={breed} value={breed}>{breed}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Gender Filter */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Sexo</label>
          <Select value={selectedGender} onValueChange={setSelectedGender}>
            <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent align="start" side="bottom" avoidCollisions={false}>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Macho">Macho</SelectItem>
              <SelectItem value="Fêmea">Fêmea</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Categoria</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent align="start" side="bottom" avoidCollisions={false}>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Garanhão">Garanhão</SelectItem>
              <SelectItem value="Castrado">Castrado</SelectItem>
              <SelectItem value="Doadora">Doadora</SelectItem>
              <SelectItem value="Matriz">Matriz</SelectItem>
              <SelectItem value="Potro">Potro</SelectItem>
              <SelectItem value="Potra">Potra</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Profile Type Filter */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Tipo de Perfil</label>
          <Select value={selectedProfile} onValueChange={setSelectedProfile}>
            <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg">
              <SelectValue placeholder="Todos os perfis" />
            </SelectTrigger>
            <SelectContent align="start" side="bottom" avoidCollisions={false}>
              <SelectItem value="all">Todos os perfis</SelectItem>
              <SelectItem value="institutional">Perfil Institucional</SelectItem>
              <SelectItem value="personal">Perfil Pessoal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location Filters */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Estado</label>
          <Select value={selectedState} onValueChange={(value) => {
            setSelectedState(value);
            setSelectedCity('all'); // Reset city when state changes
          }}>
            <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg">
              <SelectValue placeholder="Todos os estados" />
            </SelectTrigger>
            <SelectContent align="start" side="bottom" avoidCollisions={false}>
              <SelectItem value="all">Todos os estados</SelectItem>
              {availableStates.map((state) => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Cidade</label>
          <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!availableCities.length}>
            <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg disabled:opacity-50">
              <SelectValue placeholder={availableCities.length ? "Todas as cidades" : "Selecione um estado primeiro"} />
            </SelectTrigger>
            <SelectContent align="start" side="bottom" avoidCollisions={false}>
              <SelectItem value="all">Todas as cidades</SelectItem>
              {availableCities.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Awards Filter */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Premiado</label>
          <Select value={selectedAwarded} onValueChange={setSelectedAwarded}>
            <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent align="start" side="bottom" avoidCollisions={false}>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Sim">Sim</SelectItem>
              <SelectItem value="Não">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Age Filter */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Idade</label>
          <Select value={selectedAge} onValueChange={setSelectedAge}>
            <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent align="start" side="bottom" avoidCollisions={false}>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="0-2">Até 2 anos</SelectItem>
              <SelectItem value="3-5">3 a 5 anos</SelectItem>
              <SelectItem value="6-10">6 a 10 anos</SelectItem>
              <SelectItem value="11-15">11 a 15 anos</SelectItem>
              <SelectItem value="16+">16+ anos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Registration Filter */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Possui Registro</label>
          <Select value={selectedRegistered} onValueChange={setSelectedRegistered}>
            <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent align="start" side="bottom" avoidCollisions={false}>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Sim">Sim</SelectItem>
              <SelectItem value="Não">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Ordenar por</label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg">
              <SelectValue placeholder="Mais relevantes" />
            </SelectTrigger>
            <SelectContent align="start" side="bottom" avoidCollisions={false}>
              <SelectItem value="relevant">Mais relevantes</SelectItem>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="views">Mais visualizados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="w-full flex items-center justify-center gap-2 h-11 text-sm font-semibold border-slate-300 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
            Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  );
};

export default RankingFilters;

