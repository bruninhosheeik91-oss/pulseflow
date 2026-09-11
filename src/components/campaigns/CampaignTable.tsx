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
    <div className="bg-[#0B1324] border border-[#162340] rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[980px]">
          <thead>
            <tr className="border-b border-[#162340] bg-[#080E1C] text-[11px] font-semibold text-[#8E9BAE] uppercase tracking-wider">
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
          <tbody className="divide-y divide-[#121E38] text-xs">
            {campaigns.map((c) => {
              const isRunning = c.status === 'Ativa';

              return (
                <tr
                  key={c.id}
                  className="hover:bg-[#0E172C]/60 transition-colors group cursor-pointer"
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
                        <span className="font-bold text-[#E6E8EC] group-hover:text-[#00C2FF] transition-colors truncate">
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
                              ? 'bg-[#0E203B] text-[#00C2FF] border-[#18366A]'
                              : 'bg-[#151D2E] text-[#94A3B8] border-[#1C2C47]'
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
                        <span className="px-1.5 py-0.5 rounded bg-[#101A30] border border-[#182B4E] text-[#70A1FF] font-mono-numeric text-[11px] font-medium">
                          Score ≥ {c.minScore}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#101A30] border border-[#182B4E] text-[#38BDF8] font-mono-numeric text-[11px] font-medium">
                          ≥ {c.minDiscount}%
                        </span>
                      </div>
                      <div className="text-[10px] text-[#8E9BAE]">
                        {c.minPrice || c.maxPrice
                          ? `R$ ${c.minPrice || 0} - R$ ${c.maxPrice || '∞'}`
                          : 'Qualquer valor'}
                      </div>
                    </div>
                  </td>

                  {/* Canais & Frequência */}
                  <td className="py-3 px-3">
                    <div className="space-y-1 max-w-[170px]">
                      <div className="text-xs text-[#C8D1DE] truncate flex items-center gap-1">
                        <Radio className="w-3 h-3 text-[#00C2FF] shrink-0" />
                        <span className="truncate">{c.channels[0]}</span>
                        {c.channels.length > 1 && (
                          <span className="text-[#8E9BAE] text-[10px]">
                            +{c.channels.length - 1}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#8E9BAE] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#64748B]" />
                        <span>{c.frequencyLabel}</span>
                      </div>
                    </div>
                  </td>

                  {/* Disparos */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-bold font-mono-numeric text-[#E6E8EC]">
                      {c.stats.dispatchesToday}
                    </span>
                    <span className="text-[10px] text-[#64748B] block font-mono-numeric">
                      {c.stats.dispatchesTotal} total
                    </span>
                  </td>

                  {/* Cliques / Pedidos */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-bold font-mono-numeric text-[#00C2FF]">
                      {c.stats.clicksToday}
                    </span>
                    <span className="text-[10px] text-[#64748B] block font-mono-numeric">
                      {c.stats.ordersToday} pedidos
                    </span>
                  </td>

                  {/* Comissão Hoje */}
                  <td className="py-3 px-3 text-right">
                    <span className="font-bold font-mono-numeric text-emerald-400">
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
                        className="p-1.5 rounded-lg border border-[#182B4E] bg-[#0E1A33] text-[#00C2FF] hover:bg-[#15254A] transition-colors cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStatus(c)}
                        title={isRunning ? 'Pausar campanha' : 'Ativar campanha'}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isRunning
                            ? 'bg-[#0E1A33] border-[#182B4E] text-[#8E9BAE] hover:text-amber-400 hover:border-amber-500/30'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
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
                        className="p-1.5 rounded-lg border border-[#182B4E] bg-[#0E1A33] text-[#8E9BAE] hover:text-[#E6E8EC] hover:bg-[#15254A] transition-colors cursor-pointer"
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
