import React from 'react';
import { Search, SlidersHorizontal, List, LayoutGrid, X } from 'lucide-react';
import { Button } from '../ui/Button';

export type OfferSortOption =
  | 'score'
  | 'discount'
  | 'commission'
  | 'sales'
  | 'rating'
  | 'price_asc'
  | 'recent';

export type OfferViewMode = 'list' | 'grid';

interface OffersSearchBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortOption: OfferSortOption;
  onSortChange: (sort: OfferSortOption) => void;
  viewMode: OfferViewMode;
  onViewModeChange: (mode: OfferViewMode) => void;
  activeFiltersCount: number;
  onOpenFiltersDrawer: () => void;
}

export const OffersSearchBar: React.FC<OffersSearchBarProps> = ({
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
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-[#0C1324] border border-[#162340] rounded-xl">
      {/* Search Input with Guaranteed Icon Spacing */}
      <div className="relative flex-1 min-w-[260px]">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center text-[#8E9BAE]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por produto, categoria ou loja..."
          className="w-full h-9.5 pl-10 pr-9 bg-[#080E1C] border border-[#1B2B4E] rounded-lg text-xs text-[#E6E8EC] placeholder:text-[#8E9BAE] focus:outline-none focus:border-[#1E5EFF] focus:ring-1 focus:ring-[#1E5EFF] transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E9BAE] hover:text-[#E6E8EC] p-0.5 rounded transition-colors"
            title="Limpar busca"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Controls: Filtros, Ordenação, View Mode */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Drawer Trigger Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenFiltersDrawer}
          leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-[#00C2FF]" />}
          className={`h-9.5 text-xs border-[#1B2B4E] hover:border-[#263D6C] ${
            activeFiltersCount > 0
              ? 'bg-[#132247] text-[#00C2FF] border-[#1E5EFF]/60'
              : 'text-[#E6E8EC]'
          }`}
        >
          <span>Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-[#1E5EFF] text-white font-mono-numeric text-[11px] font-bold">
              {activeFiltersCount}
            </span>
          )}
        </Button>

        {/* Sort Select */}
        <div className="flex items-center gap-1.5 text-xs text-[#8E9BAE] bg-[#080E1C] border border-[#1B2B4E] rounded-lg px-2.5 h-9.5">
          <span className="shrink-0 hidden sm:inline text-[#8E9BAE]">Ordenar por:</span>
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as OfferSortOption)}
            className="bg-transparent text-xs font-semibold text-[#E6E8EC] focus:outline-none cursor-pointer pr-1"
          >
            <option value="score" className="bg-[#0E172C] text-[#E6E8EC]">
              Maior Deal Score
            </option>
            <option value="discount" className="bg-[#0E172C] text-[#E6E8EC]">
              Maior desconto
            </option>
            <option value="commission" className="bg-[#0E172C] text-[#E6E8EC]">
              Maior comissão
            </option>
            <option value="sales" className="bg-[#0E172C] text-[#E6E8EC]">
              Mais vendidos
            </option>
            <option value="rating" className="bg-[#0E172C] text-[#E6E8EC]">
              Melhor avaliação
            </option>
            <option value="price_asc" className="bg-[#0E172C] text-[#E6E8EC]">
              Menor preço
            </option>
            <option value="recent" className="bg-[#0E172C] text-[#E6E8EC]">
              Mais recentes
            </option>
          </select>
        </div>

        {/* View Mode Toggle: Lista vs Grade */}
        <div className="flex items-center bg-[#080E1C] border border-[#1B2B4E] rounded-lg p-0.5 h-9.5">
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-[#152347] text-[#00C2FF] font-semibold shadow-xs'
                : 'text-[#8E9BAE] hover:text-[#E6E8EC]'
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
                ? 'bg-[#152347] text-[#00C2FF] font-semibold shadow-xs'
                : 'text-[#8E9BAE] hover:text-[#E6E8EC]'
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
