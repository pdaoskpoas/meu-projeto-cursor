// src/components/animal/NewAnimalWizard/shared/StepSkeleton.tsx

import React from 'react';
import { Card } from '@/components/ui/card';

export const StepSkeleton: React.FC = () => {
  return (
    <Card className="p-6 space-y-6">
      {/* Título */}
      <div className="space-y-2">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
      </div>

      {/* Campos */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Botões */}
      <div className="flex justify-between pt-4">
        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    </Card>
  );
};



