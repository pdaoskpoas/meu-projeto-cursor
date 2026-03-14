import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, X, Map } from 'lucide-react';
import { HarasFilters as HarasFiltersType, brazilianStates, harasTypes, planTypes, statusTypes } from './types';

interface HarasFiltersProps {
  filters: HarasFiltersType;
  setFilters: (filters: HarasFiltersType) => void;
  showMap: boolean;
  setShowMap: (show: boolean) => void;
  totalResults: number;
}

const HarasFilters: React.FC<HarasFiltersProps> = ({
  filters,
  setFilters,
  showMap,
  setShowMap,
  totalResults
}) => {
  const updateFilter = (key: keyof HarasFiltersType, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      stateFilter: 'all',
      planFilter: 'all',
      statusFilter: 'all',
      typeFilter: 'all'
    });
  };

  return (
    <Card className="p-4 mb-6">
      <div className="space-y-4">
        {/* Linha Principal */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Busca */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, cidade ou proprietário..."
                value={filters.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Estado */}
          <Select value={filters.stateFilter} onValueChange={(value) => updateFilter('stateFilter', value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              {brazilianStates.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tipo */}
          <Select value={filters.typeFilter} onValueChange={(value) => updateFilter('typeFilter', value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start">
              <SelectItem value="all">Todos os tipos</SelectItem>
              {harasTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Toggle Mapa */}
          <Button
            variant={showMap ? "default" : "outline"}
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-2"
          >
            <Map className="h-4 w-4" />
            {showMap ? 'Lista' : 'Mapa'}
          </Button>
        </div>

        {/* Segunda Linha - Filtros Avançados */}
        <div className="flex flex-wrap gap-4 items-center pt-2 border-t">
          {/* Plano */}
          <Select value={filters.planFilter} onValueChange={(value) => updateFilter('planFilter', value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os planos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os planos</SelectItem>
              {planTypes.map((plan) => (
                <SelectItem key={plan.value} value={plan.value}>
                  {plan.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={filters.statusFilter} onValueChange={(value) => updateFilter('statusFilter', value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {statusTypes.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Limpar Filtros */}
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>

          {/* Contador de Resultados */}
          <div className="ml-auto text-sm text-gray-600">
            {totalResults} {totalResults === 1 ? 'resultado' : 'resultados'}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default HarasFilters;

