import React from 'react';
import {
  Zap,
  Clock,
  Play,
  Pause,
  ChevronRight,
  Sliders,
  Radio,
} from 'lucide-react';
import { Campaign } from '../../types';
import { MarketplaceBadge } from '../ui/MarketplaceBadge';

interface CampaignTableProps {
  campaigns: Campaign[];
  onOpenDetails: (campaign: Campaign) => void;
  onToggleStatus: (campaign: Campaign) => void;
  onRunNow: (campaign: Campaign) => void;
}

export const CampaignTable: React.FC<CampaignTableProps> = ({
  campaigns,
  onOpenDetails,
  onToggleStatus,
  onRunNow,
}) => {
  return (
    <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[980px]">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              <th className="py-3 px-4">Campanha</th>
              <th className="py-3 px-3">Marketplaces</th>
              <th className="py-3 px-3">Regras & Deal Score</th>
              <th className="py-3 px-3">Canais & Frequência</th>
              <th className="py-3 px-3 text-center">Disparos</th>
              <th className="py-3 px-3 text-center">Cliques / Pedidos</th>
              <th className="py-3 px-3 text-right">Comissão Hoje</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFF6FF] text-xs">
            {campaigns.map((c) => {
              const isRunning = c.status === 'Ativa';

              return (
                <tr
                  key={c.id}
                  className="hover:bg-[#FFFFFF]/60 transition-colors group cursor-pointer"
                  onClick={() => onOpenDetails(c)}
                >
                  {/* Campanha */}
                  <td className="py-3 px-4">
                    <div className="space-y-1 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isRunning
                              ? 'bg-emerald-400 animate-pulse'
                              : 'bg-amber-400'
                          }`}
                        />
                        <span className="font-bold text-[#172033] group-hover:text-[#2563EB] transition-colors truncate">
                          {c.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono-numeric text-[#64748B]">
                          {c.id}
                        </span>
                        <span className="text-[#334155]">•</span>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                            c.executionMode === 'Automático'
                              ? 'bg-[#EFF6FF] text-[#2563EB] border-[#E2E8F0]'
                              : 'bg-[#F1F5F9] text-[#94A3B8] border-[#CBD5E1]'
                          }`}
                        >
                          {c.executionMode}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Marketplaces */}
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap items-center gap-1 max-w-[140px]">
                      {c.marketplaces.map((mp) => (
                        <MarketplaceBadge key={mp} marketplace={mp} size="xs" />
                      ))}
                    </div>
                  </td>

                  {/* Regras & Deal Score */}
                  <td className="py-3 px-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-[#F1F5F9] border border-[#DCE3EC] text-[#2563EB] font-mono-numeric text-[11px] font-medium">
                          Score ≥ {c.minScore}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#F1F5F9] border border-[#DCE3EC] text-[#3B82F6] font-mono-numeric text-[11px] font-medium">
                          ≥ {c.minDiscount}%
                        </span>
                      </div>
                      <div className="text-[10px] text-[#64748B]">
                        {c.minPrice || c.maxPrice
                          ? `R$ ${c.minPrice || 0} - R$ ${c.maxPrice || '∞'}`
                          : 'Qualquer valor'}
                      </div>
                    </div>
                  </td>

                  {/* Canais & Frequência */}
                  <td className="py-3 px-3">
                    <div className="space-y-1 max-w-[170px]">
                      <div className="text-xs text-[#334155] truncate flex items-center gap-1">
                        <Radio className="w-3 h-3 text-[#2563EB] shrink-0" />
                        <span className="truncate">{c.channels[0]}</span>
                        {c.channels.length > 1 && (
                          <span className="text-[#64748B] text-[10px]">
                            +{c.channels.length - 1}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#64748B] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#64748B]" />
                        <span>{c.frequencyLabel}</span>
                      </div>
                    </div>
                  </td>

                  {/* Disparos */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-bold font-mono-numeric text-[#172033]">
                      {c.stats.dispatchesToday}
                    </span>
                    <span className="text-[10px] text-[#64748B] block font-mono-numeric">
                      {c.stats.dispatchesTotal} total
                    </span>
                  </td>

                  {/* Cliques / Pedidos */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-bold font-mono-numeric text-[#2563EB]">
                      {c.stats.clicksToday}
                    </span>
                    <span className="text-[10px] text-[#64748B] block font-mono-numeric">
                      {c.stats.ordersToday} pedidos
                    </span>
                  </td>

                  {/* Comissão Hoje */}
                  <td className="py-3 px-3 text-right">
                    <span className="font-bold font-mono-numeric text-emerald-700">
                      R$ {c.stats.commissionToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-[#64748B] block font-mono-numeric">
                      {c.stats.conversionRate}% conv.
                    </span>
                  </td>

                  {/* Ações */}
                  <td
                    className="py-3 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onRunNow(c)}
                        title="Disparar varredura agora"
                        className="p-1.5 rounded-lg border border-[#DCE3EC] bg-[#F1F5F9] text-[#2563EB] hover:bg-[#DBEAFE] transition-colors cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStatus(c)}
                        title={isRunning ? 'Pausar campanha' : 'Ativar campanha'}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isRunning
                            ? 'bg-[#F1F5F9] border-[#DCE3EC] text-[#64748B] hover:text-amber-700 hover:border-amber-500/30'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/20'
                        }`}
                      >
                        {isRunning ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenDetails(c)}
                        title="Ver regras e histórico"
                        className="p-1.5 rounded-lg border border-[#DCE3EC] bg-[#F1F5F9] text-[#64748B] hover:text-[#172033] hover:bg-[#DBEAFE] transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
