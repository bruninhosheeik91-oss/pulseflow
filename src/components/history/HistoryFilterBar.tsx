import React from 'react';
import {
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
  Radio,
  Store,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { HistoryStatus, HistoryFilterPeriod, Marketplace } from '../../types';

interface HistoryFilterBarProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  periodFilter: HistoryFilterPeriod;
  onPeriodChange: (period: HistoryFilterPeriod) => void;
  channelFilter: string;
  onChannelChange: (channel: string) => void;
  marketplaceFilter: string;
  onMarketplaceChange: (marketplace: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableChannels: string[];
  availableMarketplaces: string[];
  onExportCsv: () => void;
  counts: {
    todos: number;
    entregues: number;
    falhas: number;
    reenviados: number;
  };
}

export const HistoryFilterBar: React.FC<HistoryFilterBarProps> = ({
  statusFilter,
  onStatusChange,
  periodFilter,
  onPeriodChange,
  channelFilter,
  onChannelChange,
  marketplaceFilter,
  onMarketplaceChange,
  searchQuery,
  onSearchChange,
  availableChannels,
  availableMarketplaces,
  onExportCsv,
  counts,
}) => {
  const statusTabs = [
    { id: 'todos', label: 'Todos os Disparos', count: counts.todos },
    {
      id: 'Entregue',
      label: 'Entregues com Sucesso',
      count: counts.entregues,
      icon: CheckCircle2,
      color: 'text-emerald-700',
    },
    {
      id: 'Falha',
      label: 'Falhas & Bloqueios',
      count: counts.falhas,
      icon: AlertTriangle,
      color: 'text-rose-700',
    },
    {
      id: 'Re-enviado',
      label: 'Re-enviados',
      count: counts.reenviados,
      icon: RotateCcw,
      color: 'text-[#2563EB]',
    },
  ];

  const periodOptions: { id: HistoryFilterPeriod; label: string }[] = [
    { id: 'todos', label: 'Todo o Período' },
    { id: 'hoje', label: 'Hoje' },
    { id: 'ontem', label: 'Ontem' },
    { id: '7d', label: 'Últimos 7 dias' },
    { id: '30d', label: 'Últimos 30 dias' },
  ];

  return (
    <div className="space-y-3">
      {/* 1. Status Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {statusTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onStatusChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#E2E8F0] text-[#172033] border border-[#2563EB] shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] border border-transparent'
                }`}
              >
                {Icon && <Icon className={`w-3.5 h-3.5 ${tab.color}`} />}
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-[#2563EB]/30 text-[#8EC5FC]'
                      : 'bg-[#F8FAFC] text-[#64748B]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Export Button */}
        <button
          type="button"
          onClick={onExportCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#CBD5E1] border border-[#93C5FD] text-[#93C5FD] text-xs font-medium rounded-lg transition-colors shrink-0 shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Exportar Relatório CSV</span>
        </button>
      </div>

      {/* 2. Controls & Search Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2.5">
        {/* Search */}
        <div className="lg:col-span-4 relative">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por produto, canal, cupom ou campanha..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg pl-9 pr-3 py-2 text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] transition-colors"
          />
        </div>

        {/* Period Selector */}
        <div className="lg:col-span-3">
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={periodFilter}
              onChange={(e) => onPeriodChange(e.target.value as HistoryFilterPeriod)}
              className="w-full bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg pl-9 pr-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#2563EB] transition-colors"
            >
              {periodOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Channel Selector */}
        <div className="lg:col-span-3">
          <div className="relative">
            <Radio className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={channelFilter}
              onChange={(e) => onChannelChange(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg pl-9 pr-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#2563EB] transition-colors"
            >
              <option value="Todos">Todos os Canais de Destino</option>
              {availableChannels.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Marketplace Selector */}
        <div className="lg:col-span-2">
          <div className="relative">
            <Store className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={marketplaceFilter}
              onChange={(e) => onMarketplaceChange(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg pl-9 pr-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#2563EB] transition-colors"
            >
              <option value="Todos">Todos Marketplaces</option>
              {availableMarketplaces.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
