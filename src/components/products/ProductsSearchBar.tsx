import React from 'react';
import { Search, SlidersHorizontal, List, LayoutGrid, X } from 'lucide-react';
import { ProductSortOption } from '../../types';
import { Button } from '../ui/Button';

export type ProductViewMode = 'list' | 'grid';

interface ProductsSearchBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortOption: ProductSortOption;
  onSortChange: (sort: ProductSortOption) => void;
  viewMode: ProductViewMode;
  onViewModeChange: (mode: ProductViewMode) => void;
  activeFiltersCount: number;
  onOpenFiltersDrawer: () => void;
}

export const ProductsSearchBar: React.FC<ProductsSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange,
  activeFiltersCount,
  onOpenFiltersDrawer,
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
      {/* Search Input with Guaranteed Icon Alignment & Proper Padding */}
      <div className="relative flex-1 min-w-[260px]">
        <div
          aria-hidden="true"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center text-[#64748B]"
        >
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar produto, marca, modelo ou categoria..."
          className="w-full h-9.5 pl-10 pr-9 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#172033] p-0.5 rounded transition-colors"
            title="Limpar busca"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Controls: Filtros, Ordenação, Visualização */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Drawer Trigger Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenFiltersDrawer}
          leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-[#2563EB]" />}
          className={`h-9.5 text-xs border-[#CBD5E1] hover:border-[#93C5FD] ${
            activeFiltersCount > 0
              ? 'bg-[#DBEAFE] text-[#2563EB] border-[#2563EB]/60'
              : 'text-[#172033]'
          }`}
        >
          <span>Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-[#2563EB] text-white font-mono-numeric text-[11px] font-bold">
              {activeFiltersCount}
            </span>
          )}
        </Button>

        {/* Sort Select with All 8 Specified Options */}
        <div className="flex items-center gap-1.5 text-xs text-[#64748B] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 h-9.5">
          <span className="shrink-0 hidden sm:inline text-[#64748B]">
            Ordenar por:
          </span>
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as ProductSortOption)}
            className="bg-transparent text-xs font-semibold text-[#172033] focus:outline-none cursor-pointer pr-1"
          >
            <option value="best_opportunity" className="bg-[#FFFFFF] text-[#172033]">
              Melhor oportunidade
            </option>
            <option value="score" className="bg-[#FFFFFF] text-[#172033]">
              Maior Deal Score
            </option>
            <option value="price_asc" className="bg-[#FFFFFF] text-[#172033]">
              Menor preço
            </option>
            <option value="offers_count" className="bg-[#FFFFFF] text-[#172033]">
              Mais ofertas
            </option>
            <option value="sales" className="bg-[#FFFFFF] text-[#172033]">
              Mais vendidos
            </option>
            <option value="publications" className="bg-[#FFFFFF] text-[#172033]">
              Mais publicados
            </option>
            <option value="commission" className="bg-[#FFFFFF] text-[#172033]">
              Maior comissão
            </option>
            <option value="recent" className="bg-[#FFFFFF] text-[#172033]">
              Mais recentes
            </option>
          </select>
        </div>

        {/* View Mode Toggle: [ Lista ] [ Grade ] */}
        <div className="flex items-center bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-0.5 h-9.5">
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-[#DBEAFE] text-[#2563EB] font-semibold shadow-xs'
                : 'text-[#64748B] hover:text-[#172033]'
            }`}
            title="Visualização em Lista"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lista</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === 'grid'
                ? 'bg-[#DBEAFE] text-[#2563EB] font-semibold shadow-xs'
                : 'text-[#64748B] hover:text-[#172033]'
            }`}
            title="Visualização em Grade"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grade</span>
          </button>
        </div>
      </div>
    </div>
  );
};
