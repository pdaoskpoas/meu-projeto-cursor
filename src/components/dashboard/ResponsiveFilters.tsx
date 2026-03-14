import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter, Search, X } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface ResponsiveFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: Array<{
    key: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }>;
  onClearFilters?: () => void;
  className?: string;
}

const ResponsiveFilters: React.FC<ResponsiveFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onClearFilters,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = searchTerm || filters.some(filter => filter.value !== 'all');

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Buscar</label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Digite para buscar..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
          />
        </div>
      </div>

      {/* Filters */}
      {filters.map((filter) => (
        <div key={filter.key} className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">{filter.label}</label>
          <Select value={filter.value} onValueChange={filter.onChange}>
            <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="bottom" align="start" avoidCollisions={false}>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}

      {/* Clear Filters */}
      {hasActiveFilters && onClearFilters && (
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="w-full flex items-center gap-2 h-12"
        >
          <X className="h-4 w-4" />
          Limpar Filtros
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden lg:block ${className}`}>
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
            <Filter className="h-6 w-6 mr-3 text-blue-600" />
            Filtros
          </h2>
          <FilterContent />
        </div>
      </div>

      {/* Mobile Sheet */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full mb-4 h-12 flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  Ativos
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
              <SheetDescription>
                Use os filtros para encontrar exatamente o que procura
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default ResponsiveFilters;

