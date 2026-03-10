import React, { useState, useRef, useEffect } from 'react';
import { Building, MapPin, Users, Heart, ChevronDown } from 'lucide-react';

interface PropertyTypeSelectorProps {
  selectedType: string;
  onTypeSelect: (type: string) => void;
  className?: string;
}

const PropertyTypeSelector: React.FC<PropertyTypeSelectorProps> = ({ 
  selectedType, 
  onTypeSelect, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const propertyTypes = [
    {
      id: 'haras',
      name: 'Haras',
      description: 'Criação e reprodução de cavalos',
      icon: Building
    },
    {
      id: 'fazenda',
      name: 'Fazenda',
      description: 'Propriedade rural com equinos',
      icon: Users
    },
    {
      id: 'cte',
      name: 'CTE',
      description: 'Centro de Treinamento Equestre',
      icon: MapPin
    },
    {
      id: 'central-reproducao',
      name: 'Central',
      description: 'Central de Reprodução',
      icon: Heart
    }
  ];

  const selectedOption = propertyTypes.find(type => type.id === selectedType);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (typeId: string) => {
    onTypeSelect(typeId);
    setIsOpen(false);
  };

  return (
    <div className={`space-y-2 ${className}`} ref={dropdownRef}>
      <label htmlFor="property-type" className="text-sm font-semibold text-slate-700">
        Tipo de Propriedade
      </label>
      
      {/* Dropdown Button */}
      <div className="relative">
        <button
          id="property-type"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full h-12 px-4 bg-white border-2 rounded-lg text-left transition-all duration-200 flex items-center justify-between ${
            isOpen 
              ? 'border-blue-500 ring-2 ring-blue-500/20' 
              : 'border-slate-300 hover:border-slate-400'
          } ${!selectedType ? 'text-slate-400' : 'text-slate-900'}`}
        >
          <div className="flex items-center space-x-3">
            {selectedOption ? (
              <>
                <selectedOption.icon className="h-5 w-5 text-blue-600" />
                <span className="font-medium">{selectedOption.name}</span>
              </>
            ) : (
              <span>Selecione o tipo de propriedade</span>
            )}
          </div>
          <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="py-1">
              {propertyTypes.map((type) => {
                const IconComponent = type.icon;
                const isSelected = selectedType === type.id;
                
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleSelect(type.id)}
                    className={`w-full px-4 py-3 text-left transition-colors duration-150 flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-blue-100' : 'bg-slate-100'
                    }`}>
                      <IconComponent className={`h-5 w-5 ${
                        isSelected ? 'text-blue-600' : 'text-slate-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${
                        isSelected ? 'text-blue-900' : 'text-slate-900'
                      }`}>
                        {type.name}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {type.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyTypeSelector;
