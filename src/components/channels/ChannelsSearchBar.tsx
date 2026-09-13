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
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl shadow-xs">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar canal por nome, @link, instância ou campanha vinculada..."
          className="w-full h-9 pl-9 pr-8 bg-[#FFFFFF] border border-[#CBD5E1] rounded-lg text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB] transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#172033] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Selects & Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Plataforma */}
        <div className="flex items-center gap-1 bg-[#FFFFFF] border border-[#CBD5E1] rounded-lg px-2 h-9">
          <span className="text-[10px] text-[#64748B] uppercase font-semibold">
            Plataforma:
          </span>
          <select
            value={selectedPlatform}
            onChange={(e) => onSelectPlatform(e.target.value)}
            className="bg-transparent text-xs text-[#172033] focus:outline-none cursor-pointer pr-1"
          >
            <option value="Todos" className="bg-[#F8FAFC] text-[#172033]">
              Todas
            </option>
            <option value="WhatsApp" className="bg-[#F8FAFC] text-[#172033]">
              WhatsApp
            </option>
            <option value="Telegram" className="bg-[#F8FAFC] text-[#172033]">
              Telegram
            </option>
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1 bg-[#FFFFFF] border border-[#CBD5E1] rounded-lg px-2 h-9">
          <span className="text-[10px] text-[#64748B] uppercase font-semibold">
            Status:
          </span>
          <select
            value={selectedStatus}
            onChange={(e) => onSelectStatus(e.target.value)}
            className="bg-transparent text-xs text-[#172033] focus:outline-none cursor-pointer pr-1"
          >
            <option value="Todos" className="bg-[#F8FAFC] text-[#172033]">
              Todos
            </option>
            <option value="Conectado" className="bg-[#F8FAFC] text-[#172033]">
              Conectados
            </option>
            <option value="Atenção" className="bg-[#F8FAFC] text-[#172033]">
              Atenção / QR
            </option>
            <option value="Pausado" className="bg-[#F8FAFC] text-[#172033]">
              Pausados
            </option>
          </select>
        </div>

        {/* Ordenar */}
        <div className="flex items-center gap-1 bg-[#FFFFFF] border border-[#CBD5E1] rounded-lg px-2 h-9">
          <SlidersHorizontal className="w-3 h-3 text-[#64748B]" />
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as ChannelSortOption)}
            className="bg-transparent text-xs text-[#172033] focus:outline-none cursor-pointer"
          >
            <option value="audience" className="bg-[#F8FAFC] text-[#172033]">
              Maior Audiência
            </option>
            <option value="dispatches" className="bg-[#F8FAFC] text-[#172033]">
              Mais Disparos Hoje
            </option>
            <option value="delivery" className="bg-[#F8FAFC] text-[#172033]">
              Maior Taxa de Entrega
            </option>
            <option value="recent" className="bg-[#F8FAFC] text-[#172033]">
              Mais Recentes
            </option>
            <option value="name" className="bg-[#F8FAFC] text-[#172033]">
              Nome (A-Z)
            </option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-[#FFFFFF] border border-[#CBD5E1] rounded-lg p-0.5 h-9">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            title="Visualização em Grade"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-[#DBEAFE] text-[#2563EB]'
                : 'text-[#64748B] hover:text-[#172033]'
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
                ? 'bg-[#DBEAFE] text-[#2563EB]'
                : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
