import React from 'react';
import {
  Users,
  Send,
  MousePointerClick,
  ShieldCheck,
  Radio,
  AlertTriangle,
} from 'lucide-react';
import { ChannelQuickFilter } from '../../types';

interface ChannelsMetricsBarProps {
  activeFilter: ChannelQuickFilter;
  onSelectFilter: (filter: ChannelQuickFilter) => void;
  counts: {
    total: number;
    whatsapp: number;
    telegram: number;
    connected: number;
    attention: number;
    highAudience: number;
  };
  summaryStats: {
    totalAudience: number;
    messagesToday: number;
    clicksToday: number;
    avgDeliveryRate: number;
  };
}

export const ChannelsMetricsBar: React.FC<ChannelsMetricsBarProps> = ({
  activeFilter,
  onSelectFilter,
  counts,
  summaryStats,
}) => {
  const filterPills: {
    id: ChannelQuickFilter;
    label: string;
    count: number;
    highlight?: 'green' | 'amber' | 'blue';
  }[] = [
    { id: 'Todos', label: 'Todos os Canais', count: counts.total },
    { id: 'WhatsApp', label: 'WhatsApp', count: counts.whatsapp, highlight: 'green' },
    { id: 'Telegram', label: 'Telegram', count: counts.telegram, highlight: 'blue' },
    { id: 'Conectados', label: 'Conectados', count: counts.connected, highlight: 'green' },
    { id: 'Atenção', label: 'Atenção / QR', count: counts.attention, highlight: 'amber' },
    { id: 'Alta Audiência', label: 'Alta Audiência (+5k)', count: counts.highAudience },
  ];

  return (
    <div className="space-y-3">
      {/* 1. Quick Filters Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filterPills.map((pill) => {
          const isActive = activeFilter === pill.id;

          let badgeColorClass = 'bg-[#E2E8F0] text-[#64748B]';
          if (isActive) {
            badgeColorClass = 'bg-white/20 text-[#172033]';
          } else if (pill.highlight === 'green') {
            badgeColorClass = 'bg-emerald-500/15 text-emerald-700';
          } else if (pill.highlight === 'amber') {
            badgeColorClass = 'bg-amber-500/15 text-amber-700';
          } else if (pill.highlight === 'blue') {
            badgeColorClass = 'bg-[#2563EB]/15 text-[#2563EB]';
          }

          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => onSelectFilter(pill.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-sm font-semibold'
                  : 'bg-[#F1F5F9] border border-[#E2E8F0] text-[#64748B] hover:text-[#172033] hover:border-[#BFDBFE]'
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`font-mono-numeric text-[10px] font-bold px-1.5 py-0.2 rounded ${badgeColorClass}`}
              >
                {pill.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Consolidated Today Performance Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Audiência Total */}
        <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-[#64748B] uppercase font-semibold tracking-wider block">
              Audiência Total
            </span>
            <span className="text-base font-bold font-mono-numeric text-[#172033]">
              {summaryStats.totalAudience.toLocaleString('pt-BR')}
            </span>
            <span className="text-[10px] text-[#64748B] block">
              membros e inscritos ativos
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#2563EB]">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Mensagens Enviadas Hoje */}
        <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-[#64748B] uppercase font-semibold tracking-wider block">
              Disparos Hoje
            </span>
            <span className="text-base font-bold font-mono-numeric text-[#2563EB]">
              {summaryStats.messagesToday} msgs
            </span>
            <span className="text-[10px] text-emerald-700 block font-mono-numeric">
              100% no horário programado
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#EFF6FF] border border-[#E2E8F0] text-[#2563EB]">
            <Send className="w-4 h-4" />
          </div>
        </div>

        {/* Cliques Gerados Hoje */}
        <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-[#64748B] uppercase font-semibold tracking-wider block">
              Cliques Gerados Hoje
            </span>
            <span className="text-base font-bold font-mono-numeric text-[#3B82F6]">
              {summaryStats.clicksToday.toLocaleString('pt-BR')}
            </span>
            <span className="text-[10px] text-[#64748B] block font-mono-numeric">
              ~{(summaryStats.clicksToday / (summaryStats.messagesToday || 1)).toFixed(0)} cliques / disparo
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#EFF6FF] border border-[#E2E8F0] text-[#3B82F6]">
            <MousePointerClick className="w-4 h-4" />
          </div>
        </div>

        {/* Taxa de Entrega */}
        <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-[#64748B] uppercase font-semibold tracking-wider block">
              Taxa de Entrega
            </span>
            <span className="text-base font-bold font-mono-numeric text-emerald-700">
              {summaryStats.avgDeliveryRate.toFixed(1)}%
            </span>
            <span className="text-[10px] text-emerald-700 block font-mono-numeric">
              Proteção anti-ban ativa
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
