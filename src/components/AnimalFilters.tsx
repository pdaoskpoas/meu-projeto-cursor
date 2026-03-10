import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';

interface AnimalFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterBreed: string;
  onBreedChange: (value: string) => void;
  breeds: string[];
  filterGender?: string;
  onGenderChange?: (value: string) => void;
}

export const AnimalFilters: React.FC<AnimalFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterBreed,
  onBreedChange,
  breeds,
  filterGender,
  onGenderChange
}) => {
  return (
    <Card className="card-professional p-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-medium" />
            <Input
              placeholder="Buscar por nome do equino..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="w-full sm:w-48">
          <select
            value={filterBreed}
            onChange={(e) => onBreedChange(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todas as raças</option>
            {breeds.map(breed => (
              <option key={breed} value={breed}>{breed}</option>
            ))}
          </select>
        </div>

        {onGenderChange && (
          <div className="w-full sm:w-32">
            <select
              value={filterGender || ''}
              onChange={(e) => onGenderChange(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos</option>
              <option value="Macho">Machos</option>
              <option value="Fêmea">Fêmeas</option>
            </select>
          </div>
        )}
      </div>
    </Card>
  );
};