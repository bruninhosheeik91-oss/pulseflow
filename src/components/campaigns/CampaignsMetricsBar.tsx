import React from 'react';
import {
  Megaphone,
  CheckCircle2,
  PauseCircle,
  Zap,
  Sliders,
  TrendingUp,
} from 'lucide-react';
import { CampaignQuickFilter } from '../../types';

interface CampaignsMetricsBarProps {
  activeFilter: CampaignQuickFilter;
  onSelectFilter: (filter: CampaignQuickFilter) => void;
  counts: {
    total: number;
    active: number;
    paused: number;
    automatic: number;
    manual: number;
    highPerformance: number;
  };
  todayStats: {
    dispatches: number;
    clicks: number;
    commission: number;
  };
}

export const CampaignsMetricsBar: React.FC<CampaignsMetricsBarProps> = ({
  activeFilter,
  onSelectFilter,
  counts,
  todayStats,
}) => {
  const filterItems: Array<{
    id: CampaignQuickFilter;
    label: string;
    count: number;
    icon: React.ElementType;
    highlight?: boolean;
  }> = [
    {
      id: 'Todas',
      label: 'Todas',
      count: counts.total,
      icon: Megaphone,
    },
    {
      id: 'Ativas',
      label: 'Ativas',
      count: counts.active,
      icon: CheckCircle2,
    },
    {
      id: 'Pausadas',
      label: 'Pausadas',
      count: counts.paused,
      icon: PauseCircle,
    },
    {
      id: 'Automáticas',
      label: 'Automáticas',
      count: counts.automatic,
      icon: Zap,
    },
    {
      id: 'Revisão Manual',
      label: 'Revisão Manual',
      count: counts.manual,
      icon: Sliders,
    },
    {
      id: 'Alta Performance',
      label: 'Alta Performance',
      count: counts.highPerformance,
      icon: TrendingUp,
      highlight: true,
    },
  ];

  return (
    <div className="space-y-3">
      {/* 1. Quick Filters Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterItems.map((item) => {
          const Icon = item.icon;
          const isSelected = activeFilter === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectFilter(item.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#DBEAFE] border-[#2563EB] text-white shadow-xs'
                  : 'bg-[#F1F5F9] border-[#E2E8F0] text-[#64748B] hover:text-[#172033] hover:border-[#E2E8F0]'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isSelected
                    ? 'text-[#2563EB]'
                    : item.highlight
                    ? 'text-emerald-700'
                    : 'text-[#64748B]'
                }`}
              />
              <span>{item.label}</span>
              <span
                className={`font-mono-numeric text-[11px] px-1.5 py-0.5 rounded-md ${
                  isSelected
                    ? 'bg-[#2563EB]/15 text-[#2563EB] font-bold'
                    : 'bg-[#F1F5F9] text-[#64748B]'
                }`}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Today's Consolidated Activity Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#64748B] font-medium block">
              Disparos Realizados Hoje
            </span>
            <span className="text-lg font-bold font-mono-numeric text-[#172033]">
              {todayStats.dispatches}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#2563EB]">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#64748B] font-medium block">
              Cliques Gerados Hoje
            </span>
            <span className="text-lg font-bold font-mono-numeric text-[#172033]">
              {todayStats.clicks.toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#2563EB]">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#64748B] font-medium block">
              Comissão Estimada Hoje
            </span>
            <span className="text-lg font-bold font-mono-numeric text-emerald-700">
              R$ {todayStats.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
