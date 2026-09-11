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
                  ? 'bg-[#15254A] border-[#1E5EFF] text-white shadow-xs'
                  : 'bg-[#0B1324] border-[#162340] text-[#8E9BAE] hover:text-[#E6E8EC] hover:border-[#1E325A]'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isSelected
                    ? 'text-[#00C2FF]'
                    : item.highlight
                    ? 'text-emerald-400'
                    : 'text-[#64748B]'
                }`}
              />
              <span>{item.label}</span>
              <span
                className={`font-mono-numeric text-[11px] px-1.5 py-0.5 rounded-md ${
                  isSelected
                    ? 'bg-[#00C2FF]/15 text-[#00C2FF] font-bold'
                    : 'bg-[#101A30] text-[#8E9BAE]'
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
        <div className="bg-[#0B1324] border border-[#162340] rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#8E9BAE] font-medium block">
              Disparos Realizados Hoje
            </span>
            <span className="text-lg font-bold font-mono-numeric text-[#E6E8EC]">
              {todayStats.dispatches}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#101E3B] border border-[#1B3566] flex items-center justify-center text-[#00C2FF]">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0B1324] border border-[#162340] rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#8E9BAE] font-medium block">
              Cliques Gerados Hoje
            </span>
            <span className="text-lg font-bold font-mono-numeric text-[#E6E8EC]">
              {todayStats.clicks.toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#0F223D] border border-[#1B3E6E] flex items-center justify-center text-[#00C2FF]">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0B1324] border border-[#162340] rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#8E9BAE] font-medium block">
              Comissão Estimada Hoje
            </span>
            <span className="text-lg font-bold font-mono-numeric text-emerald-400">
              R$ {todayStats.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
