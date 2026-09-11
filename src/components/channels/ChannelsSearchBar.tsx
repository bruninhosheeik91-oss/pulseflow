import React from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  Filter,
} from 'lucide-react';
import { ChannelSortOption } from '../../types';

export type ChannelViewMode = 'grid' | 'table';

interface ChannelsSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  sortOption: ChannelSortOption;
  onSortChange: (option: ChannelSortOption) => void;
  viewMode: ChannelViewMode;
  onViewModeChange: (mode: ChannelViewMode) => void;
}

export const ChannelsSearchBar: React.FC<ChannelsSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedPlatform,
  onSelectPlatform,
  selectedStatus,
  onSelectStatus,
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 bg-[#0A1020] border border-[#162340] rounded-xl shadow-xs">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar canal por nome, @link, instância ou campanha vinculada..."
          className="w-full h-9 pl-9 pr-8 bg-[#070C18] border border-[#1A2C4E] rounded-lg text-xs text-[#E6E8EC] placeholder:text-[#64748B] focus:outline-none focus:border-[#1E5EFF] transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#E6E8EC] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Selects & Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Plataforma */}
        <div className="flex items-center gap-1 bg-[#070C18] border border-[#1A2C4E] rounded-lg px-2 h-9">
          <span className="text-[10px] text-[#64748B] uppercase font-semibold">
            Plataforma:
          </span>
          <select
            value={selectedPlatform}
            onChange={(e) => onSelectPlatform(e.target.value)}
            className="bg-transparent text-xs text-[#E6E8EC] focus:outline-none cursor-pointer pr-1"
          >
            <option value="Todos" className="bg-[#0A1020] text-[#E6E8EC]">
              Todas
            </option>
            <option value="WhatsApp" className="bg-[#0A1020] text-[#E6E8EC]">
              WhatsApp
            </option>
            <option value="Telegram" className="bg-[#0A1020] text-[#E6E8EC]">
              Telegram
            </option>
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1 bg-[#070C18] border border-[#1A2C4E] rounded-lg px-2 h-9">
          <span className="text-[10px] text-[#64748B] uppercase font-semibold">
            Status:
          </span>
          <select
            value={selectedStatus}
            onChange={(e) => onSelectStatus(e.target.value)}
            className="bg-transparent text-xs text-[#E6E8EC] focus:outline-none cursor-pointer pr-1"
          >
            <option value="Todos" className="bg-[#0A1020] text-[#E6E8EC]">
              Todos
            </option>
            <option value="Conectado" className="bg-[#0A1020] text-[#E6E8EC]">
              Conectados
            </option>
            <option value="Atenção" className="bg-[#0A1020] text-[#E6E8EC]">
              Atenção / QR
            </option>
            <option value="Pausado" className="bg-[#0A1020] text-[#E6E8EC]">
              Pausados
            </option>
          </select>
        </div>

        {/* Ordenar */}
        <div className="flex items-center gap-1 bg-[#070C18] border border-[#1A2C4E] rounded-lg px-2 h-9">
          <SlidersHorizontal className="w-3 h-3 text-[#64748B]" />
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as ChannelSortOption)}
            className="bg-transparent text-xs text-[#E6E8EC] focus:outline-none cursor-pointer"
          >
            <option value="audience" className="bg-[#0A1020] text-[#E6E8EC]">
              Maior Audiência
            </option>
            <option value="dispatches" className="bg-[#0A1020] text-[#E6E8EC]">
              Mais Disparos Hoje
            </option>
            <option value="delivery" className="bg-[#0A1020] text-[#E6E8EC]">
              Maior Taxa de Entrega
            </option>
            <option value="recent" className="bg-[#0A1020] text-[#E6E8EC]">
              Mais Recentes
            </option>
            <option value="name" className="bg-[#0A1020] text-[#E6E8EC]">
              Nome (A-Z)
            </option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-[#070C18] border border-[#1A2C4E] rounded-lg p-0.5 h-9">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            title="Visualização em Grade"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-[#15254A] text-[#00C2FF]'
                : 'text-[#8E9BAE] hover:text-[#E6E8EC]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            title="Visualização em Lista / Tabela"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-[#15254A] text-[#00C2FF]'
                : 'text-[#8E9BAE] hover:text-[#E6E8EC]'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
