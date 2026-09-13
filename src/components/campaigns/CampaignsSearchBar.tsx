import React from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  LayoutGrid,
  List,
} from 'lucide-react';
import { CampaignSortOption } from '../../types';

export type CampaignViewMode = 'grid' | 'list';

interface CampaignsSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOption: CampaignSortOption;
  onSortChange: (sort: CampaignSortOption) => void;
  viewMode: CampaignViewMode;
  onViewModeChange: (mode: CampaignViewMode) => void;
  selectedMarketplace: string;
  onSelectMarketplace: (marketplace: string) => void;
}

export const CampaignsSearchBar: React.FC<CampaignsSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange,
  selectedMarketplace,
  onSelectMarketplace,
}) => {
  const marketplaces = [
    'Todos',
    'Shopee',
    'Mercado Livre',
    'Amazon',
    'AliExpress',
    'Magalu',
    'TikTok Shop',
  ];

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-2.5">
      {/* Search Input with rigorous icon padding */}
      <div className="relative flex-1 min-w-[240px]">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar campanha por nome, canal, categoria ou marketplace..."
          className="w-full h-9 pl-10 pr-9 bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB] transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B] hover:text-[#172033]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter and Control Group */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Marketplace Select Filter */}
        <div className="relative">
          <select
            value={selectedMarketplace}
            onChange={(e) => onSelectMarketplace(e.target.value)}
            className="h-9 px-3 bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg text-xs font-medium text-[#334155] focus:outline-none focus:border-[#2563EB] cursor-pointer appearance-none pr-8"
          >
            {marketplaces.map((m) => (
              <option key={m} value={m} className="bg-[#F1F5F9] text-[#172033]">
                {m === 'Todos' ? 'Todos Marketplaces' : m}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
            <SlidersHorizontal className="w-3 h-3" />
          </div>
        </div>

        {/* Sort Select */}
        <div className="relative">
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as CampaignSortOption)}
            className="h-9 px-3 bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg text-xs font-medium text-[#334155] focus:outline-none focus:border-[#2563EB] cursor-pointer appearance-none pr-8"
          >
            <option value="dispatches" className="bg-[#F1F5F9] text-[#172033]">
              Mais disparos hoje
            </option>
            <option value="commission" className="bg-[#F1F5F9] text-[#172033]">
              Maior comissão
            </option>
            <option value="score" className="bg-[#F1F5F9] text-[#172033]">
              Maior Deal Score mín.
            </option>
            <option value="clicks" className="bg-[#F1F5F9] text-[#172033]">
              Mais cliques gerados
            </option>
            <option value="recent" className="bg-[#F1F5F9] text-[#172033]">
              Mais recentes
            </option>
            <option value="name" className="bg-[#F1F5F9] text-[#172033]">
              Nome (A-Z)
            </option>
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
            <ArrowUpDown className="w-3 h-3" />
          </div>
        </div>

        {/* View Mode Toggle: [ Grade ] [ Lista ] */}
        <div className="flex items-center bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            title="Visualização em Grade"
            className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-[#DBEAFE] text-[#2563EB] shadow-xs'
                : 'text-[#64748B] hover:text-[#94A3B8]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            title="Visualização em Lista"
            className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[#DBEAFE] text-[#2563EB] shadow-xs'
                : 'text-[#64748B] hover:text-[#94A3B8]'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
