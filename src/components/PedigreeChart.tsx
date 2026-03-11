import React from 'react';
import { Card } from '@/components/ui/card';

interface AncestorNode {
  name: string;
  gender: 'Macho' | 'Fêmea';
  father?: AncestorNode;
  mother?: AncestorNode;
}

interface PedigreeChartProps {
  horse: {
    father?: string | null;
    mother?: string | null;
    paternalGrandfather?: string | null;
    paternalGrandmother?: string | null;
    maternalGrandfather?: string | null;
    maternalGrandmother?: string | null;
  };
}

const PedigreeChart: React.FC<PedigreeChartProps> = ({ horse }) => {
  const paternalLine: AncestorNode | undefined = horse.father
    ? {
        name: horse.father,
        gender: 'Macho',
        father: horse.paternalGrandfather
          ? { name: horse.paternalGrandfather, gender: 'Macho' }
          : undefined,
        mother: horse.paternalGrandmother
          ? { name: horse.paternalGrandmother, gender: 'Fêmea' }
          : undefined,
      }
    : undefined;

  const maternalLine: AncestorNode | undefined = horse.mother
    ? {
        name: horse.mother,
        gender: 'Fêmea',
        father: horse.maternalGrandfather
          ? { name: horse.maternalGrandfather, gender: 'Macho' }
          : undefined,
        mother: horse.maternalGrandmother
          ? { name: horse.maternalGrandmother, gender: 'Fêmea' }
          : undefined,
      }
    : undefined;

  const renderLineageBlock = (line: 'Paternal' | 'Maternal', ancestor?: AncestorNode) => {
    const isPaternal = line === 'Paternal';
    const mainGenderIcon = isPaternal ? '♂' : '♀';
    const parentLabel = isPaternal ? 'Pai' : 'Mãe';

    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className={`px-4 py-3 sm:px-6 sm:py-4 ${isPaternal ? 'bg-orange-50 border-b border-orange-200' : 'bg-purple-50 border-b border-purple-200'}`}>
          <div className="flex items-center">
            <span className={`text-xl sm:text-2xl font-bold mr-2 sm:mr-3 ${isPaternal ? 'text-orange-600' : 'text-purple-600'}`}>
              {mainGenderIcon}
            </span>
            <h4 className={`text-lg sm:text-xl font-bold ${isPaternal ? 'text-orange-800' : 'text-purple-800'}`}>
              {parentLabel}
            </h4>
          </div>
          <p className="text-base sm:text-lg font-semibold text-slate-900 mt-1 sm:mt-2 break-words">
            {ancestor?.name || 'Não informado'}
          </p>
        </div>

        {/* Content */}
        {ancestor && (
          <div className="p-3 sm:p-6">
            {/* Grandparents Row — empilha em mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              {/* Grandfather */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center mb-1 sm:mb-3">
                  <span className="text-blue-600 font-bold text-base sm:text-lg mr-2">♂</span>
                  <h5 className="font-semibold text-slate-700 text-sm sm:text-base">Avô</h5>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4">
                  <p className="font-medium text-slate-800 text-sm sm:text-base break-words">{ancestor.father?.name || 'Não informado'}</p>
                </div>
                
                {/* Great-grandparents (Father's side) */}
                {ancestor.father && (
                  <div className="ml-2 sm:ml-4 space-y-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Bisavós</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white border border-slate-100 rounded p-2">
                        <div className="flex items-center mb-1">
                          <span className="text-blue-500 text-sm font-bold mr-1">♂</span>
                          <span className="text-xs text-slate-500">Bisavô</span>
                        </div>
                        <p className="text-xs font-medium text-slate-700 break-words">{ancestor.father.father?.name || 'N/A'}</p>
                      </div>
                      <div className="bg-white border border-slate-100 rounded p-2">
                        <div className="flex items-center mb-1">
                          <span className="text-pink-500 text-sm font-bold mr-1">♀</span>
                          <span className="text-xs text-slate-500">Bisavó</span>
                        </div>
                        <p className="text-xs font-medium text-slate-700 break-words">{ancestor.father.mother?.name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Grandmother */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center mb-1 sm:mb-3">
                  <span className="text-pink-600 font-bold text-base sm:text-lg mr-2">♀</span>
                  <h5 className="font-semibold text-slate-700 text-sm sm:text-base">Avó</h5>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4">
                  <p className="font-medium text-slate-800 text-sm sm:text-base break-words">{ancestor.mother?.name || 'Não informado'}</p>
                </div>
                
                {/* Great-grandparents (Mother's side) */}
                {ancestor.mother && (
                  <div className="ml-2 sm:ml-4 space-y-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Bisavós</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white border border-slate-100 rounded p-2">
                        <div className="flex items-center mb-1">
                          <span className="text-blue-500 text-sm font-bold mr-1">♂</span>
                          <span className="text-xs text-slate-500">Bisavô</span>
                        </div>
                        <p className="text-xs font-medium text-slate-700 break-words">{ancestor.mother.father?.name || 'N/A'}</p>
                      </div>
                      <div className="bg-white border border-slate-100 rounded p-2">
                        <div className="flex items-center mb-1">
                          <span className="text-pink-500 text-sm font-bold mr-1">♀</span>
                          <span className="text-xs text-slate-500">Bisavó</span>
                        </div>
                        <p className="text-xs font-medium text-slate-700 break-words">{ancestor.mother.mother?.name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-4 py-4 sm:px-8 sm:py-6 border-b border-slate-200">
        <div className="text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">Árvore Genealógica</h3>
          <p className="text-sm sm:text-base text-slate-600">Conheça a linhagem completa do animal</p>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-3 sm:p-8 space-y-6 sm:space-y-8">
        {/* Paternal Lineage */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-100 rounded-full flex items-center justify-center mr-2 sm:mr-3">
              <span className="text-orange-600 font-bold text-base sm:text-lg">♂</span>
            </div>
            <h4 className="text-lg sm:text-xl font-bold text-slate-900">Linhagem Paterna</h4>
          </div>
          {renderLineageBlock('Paternal', paternalLine)}
        </div>

        {/* Maternal Lineage */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2 sm:mr-3">
              <span className="text-purple-600 font-bold text-base sm:text-lg">♀</span>
            </div>
            <h4 className="text-lg sm:text-xl font-bold text-slate-900">Linhagem Materna</h4>
          </div>
          {renderLineageBlock('Maternal', maternalLine)}
        </div>
      </div>
    </Card>
  );
};

export default PedigreeChart;
