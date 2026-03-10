import React from 'react';
import { Card } from '@/components/ui/card';
import type { Animal } from '@/types/animal';

interface AnimalStatsProps {
  animals: Animal[];
}

export const AnimalStats: React.FC<AnimalStatsProps> = ({ animals }) => {
  const breeds = [...new Set(animals.map(animal => animal.breed))];
  const males = animals.filter(animal => animal.gender === 'Macho');
  const females = animals.filter(animal => animal.gender === 'Fêmea');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <Card className="card-professional p-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-dark">{animals.length}</p>
          <p className="text-sm text-gray-medium">Total de Equinos</p>
        </div>
      </Card>
      <Card className="card-professional p-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-dark">{breeds.length}</p>
          <p className="text-sm text-gray-medium">Raças</p>
        </div>
      </Card>
      <Card className="card-professional p-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-dark text-blue-600">{males.length}</p>
          <p className="text-sm text-gray-medium">Machos ♂</p>
        </div>
      </Card>
      <Card className="card-professional p-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-dark text-pink-600">{females.length}</p>
          <p className="text-sm text-gray-medium">Fêmeas ♀</p>
        </div>
      </Card>
    </div>
  );
};