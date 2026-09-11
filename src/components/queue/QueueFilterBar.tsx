import React from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  LayoutList,
  Table as TableIcon,
  Calendar,
} from 'lucide-react';
import {
  QueueFilterTab,
  QueueSortOption,
  QueueViewMode,
  QueueItem,
  AutomationType,
  AUTOMATION_TYPE_LABELS,
} from '../../types';

interface QueueFilterBarProps {
  activeTab: QueueFilterTab;
  onTabChange: (tab: QueueFilterTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedChannel: string;
  onChannelChange: (channel: string) => void;
  selectedMarketplace: string;
  onMarketplaceChange: (mp: string) => void;
  selectedAutomation: string;
  onAutomationChange: (origin: string) => void;
  selectedCampaign: string;
  onCampaignChange: (camp: string) => void;
  sortOption: QueueSortOption;
  onSortChange: (sort: QueueSortOption) => void;
  viewMode: QueueViewMode;
  onViewModeChange: (mode: QueueViewMode) => void;
  queueCounts: {
    todos: number;
    emFila: number;
    agendados: number;
    publicando: number;
    publicados: number;
    falhas: number;
  };
  availableChannels: string[];
  availableMarketplaces: string[];
  availableAutomations: string[];
  availableCampaigns: string[];
}

export const AUTOMATION_OPTIONS: { id: string; label: string }[] = [
  { id: 'AUTO_SEARCH', label: AUTOMATION_TYPE_LABELS.AUTO_SEARCH },
  { id: 'LINK_LIST', label: AUTOMATION_TYPE_LABELS.LINK_LIST },
  { id: 'MIRROR', label: AUTOMATION_TYPE_LABELS.MIRROR },
  { id: 'MONITOR_GROUP', label: AUTOMATION_TYPE_LABELS.MONITOR_GROUP },
];

export const QueueFilterBar: React.FC<QueueFilterBarProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedChannel,
  onChannelChange,
  selectedMarketplace,
  onMarketplaceChange,
  selectedAutomation,
  onAutomationChange,
  selectedCampaign,
  onCampaignChange,
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange,
  queueCounts,
  availableChannels,
  availableMarketplaces,
  availableAutomations,
  availableCampaigns,
}) => {
  const tabs: { id: QueueFilterTab; label: string; count: number }[] = [
    { id: 'Todos', label: 'Todos', count: queueCounts.todos },
    { id: 'Em fila', label: 'Em fila', count: queueCounts.emFila },
    { id: 'Agendados', label: 'Agendados', count: queueCounts.agendados },
    { id: 'Publicando', label: 'Enviando', count: queueCounts.publicando },
    { id: 'Publicados', label: 'Concluídos', count: queueCounts.publicados },
    { id: 'Falhas', label: 'Falhas', count: queueCounts.falhas },
  ];

  return (
    <div className="space-y-3">
      {/* Top row: Status Tabs & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#16233B] pb-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#1E5EFF] text-white shadow-sm shadow-[#1E5EFF]/20 font-semibold'
                    : 'text-[#94A3B8] hover:text-[#E6E8EC] hover:bg-[#0E1628]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono-numeric ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#142038] text-[#8E9BAE] border border-[#1E3054]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#0E1628] border border-[#1B2947] p-1 rounded-lg shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onViewModeChange('timeline')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              viewMode === 'timeline'
                ? 'bg-[#1B2947] text-white font-medium shadow-xs'
                : 'text-[#94A3B8] hover:text-[#E6E8EC]'
            }`}
            title="Visualização em Linha do Tempo e Cards"
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grade / Cronograma</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              viewMode === 'table'
                ? 'bg-[#1B2947] text-white font-medium shadow-xs'
                : 'text-[#94A3B8] hover:text-[#E6E8EC]'
            }`}
            title="Visualização em Tabela Densa"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tabela Operacional</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Search input, Marketplace, Channel, Campaign & Sort Selects */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-[#8E9BAE] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por produto, canal, cupom ou campanha..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#0E1628] border border-[#1B2947] rounded-lg pl-9 pr-8 py-1.5 text-xs text-[#E6E8EC] placeholder-[#8E9BAE] focus:outline-none focus:border-[#1E5EFF] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E9BAE] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Channel Filter */}
        <div className="min-w-[150px]">
          <select
            value={selectedChannel}
            onChange={(e) => onChannelChange(e.target.value)}
            className="w-full bg-[#0E1628] border border-[#1B2947] rounded-lg px-2.5 py-1.5 text-xs text-[#E6E8EC] focus:outline-none focus:border-[#1E5EFF] transition-colors"
          >
            <option value="Todos">Todos os Canais</option>
            {availableChannels.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Marketplace Filter */}
        <div className="min-w-[130px]">
          <select
            value={selectedMarketplace}
            onChange={(e) => onMarketplaceChange(e.target.value)}
            className="w-full bg-[#0E1628] border border-[#1B2947] rounded-lg px-2.5 py-1.5 text-xs text-[#E6E8EC] focus:outline-none focus:border-[#1E5EFF] transition-colors"
          >
            <option value="Todos">Marketplaces</option>
            {availableMarketplaces.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Automation Origin Filter */}
        <div className="min-w-[130px]">
          <select
            value={selectedAutomation}
            onChange={(e) => onAutomationChange(e.target.value)}
            className="w-full bg-[#0E1628] border border-[#1B2947] rounded-lg px-2.5 py-1.5 text-xs text-[#E6E8EC] focus:outline-none focus:border-[#1E5EFF] transition-colors"
          >
            <option value="Todos">Origens</option>
            {AUTOMATION_OPTIONS.filter((o) =>
              availableAutomations.includes(o.id)
            ).map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Campaign Filter */}
        <div className="min-w-[140px]">
          <select
            value={selectedCampaign}
            onChange={(e) => onCampaignChange(e.target.value)}
            className="w-full bg-[#0E1628] border border-[#1B2947] rounded-lg px-2.5 py-1.5 text-xs text-[#E6E8EC] focus:outline-none focus:border-[#1E5EFF] transition-colors"
          >
            <option value="Todos">Todas Campanhas</option>
            {availableCampaigns.map((camp) => (
              <option key={camp} value={camp}>
                {camp}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Option */}
        <div className="min-w-[140px]">
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as QueueSortOption)}
            className="w-full bg-[#0E1628] border border-[#1B2947] rounded-lg px-2.5 py-1.5 text-xs text-[#E6E8EC] focus:outline-none focus:border-[#1E5EFF] transition-colors"
          >
            <option value="time-asc">Horário: Próximos</option>
            <option value="time-desc">Horário: Tardios</option>
            <option value="score">Maior Deal Score</option>
            <option value="priority">Prioridade Alta</option>
            <option value="discount">Maior Desconto (%)</option>
            <option value="price">Menor Preço (R$)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
