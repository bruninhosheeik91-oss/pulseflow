import React from 'react';
import {
  Zap,
  Clock,
  Radio,
  Sliders,
  TrendingUp,
  Play,
  Pause,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Campaign } from '../../types';
import { MarketplaceBadge } from '../ui/MarketplaceBadge';
import { AutomationOriginBadge } from '../ui/AutomationOriginBadge';

interface CampaignCardProps {
  campaign: Campaign;
  onOpenDetails: (campaign: Campaign) => void;
  onToggleStatus: (campaign: Campaign) => void;
  onRunNow: (campaign: Campaign) => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  onOpenDetails,
  onToggleStatus,
  onRunNow,
}) => {
  const isRunning = campaign.status === 'Ativa';

  return (
    <div className="bg-[#0B1324] border border-[#162340] hover:border-[#1E3A6E] rounded-xl p-4 transition-all duration-200 flex flex-col justify-between group shadow-sm">
      <div className="space-y-3.5">
        {/* Top Header: Status & Mode */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Status Pill */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
                isRunning
                  ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                  : 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              {campaign.status}
            </span>

            {/* Execution Mode */}
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                campaign.executionMode === 'Automático'
                  ? 'bg-[#0E203B] text-[#00C2FF] border-[#18366A]'
                  : 'bg-[#151D2E] text-[#94A3B8] border-[#1C2C47]'
              }`}
            >
              {campaign.executionMode}
            </span>
          </div>

          {/* Quick Pause / Activate Switch */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(campaign);
            }}
            title={isRunning ? 'Pausar campanha' : 'Ativar campanha'}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isRunning
                ? 'bg-[#0E1B33] border-[#1B325E] text-[#8E9BAE] hover:text-amber-400 hover:border-amber-500/30'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {isRunning ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Campaign Title & Description */}
        <div
          onClick={() => onOpenDetails(campaign)}
          className="cursor-pointer space-y-1"
        >
          <h3 className="text-sm font-bold text-[#E6E8EC] group-hover:text-[#00C2FF] transition-colors leading-snug">
            {campaign.name}
          </h3>
          <p className="text-xs text-[#8E9BAE] line-clamp-2 leading-relaxed">
            {campaign.description}
          </p>
        </div>

        {/* Marketplaces Target Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {campaign.marketplaces.map((mp) => (
            <MarketplaceBadge key={mp} marketplace={mp} size="xs" />
          ))}
        </div>

        {/* Automation Sources - Como as ofertas entram */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold mr-0.5">
            Entra por:
          </span>
          {campaign.automationSources.map((source) => (
            <AutomationOriginBadge key={source} source={source} />
          ))}
        </div>

        {/* Rules & Criteria Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="px-2 py-0.5 rounded bg-[#101A30] border border-[#182B4E] text-[#70A1FF] font-mono-numeric font-medium">
            Score ≥ {campaign.minScore}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#101A30] border border-[#182B4E] text-[#38BDF8] font-mono-numeric font-medium">
            ≥ {campaign.minDiscount}% OFF
          </span>
          <span className="px-2 py-0.5 rounded bg-[#0A1224] border border-[#162340] text-[#8E9BAE] flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#64748B]" />
            <span>{campaign.frequency}</span>
          </span>
        </div>

        {/* Channels */}
        <div className="pt-1 text-xs text-[#8E9BAE] flex items-center gap-1.5 truncate">
          <Radio className="w-3.5 h-3.5 text-[#00C2FF] shrink-0" />
          <span className="truncate">
            {campaign.channels.length} {campaign.channels.length === 1 ? 'canal' : 'canais'}:{' '}
            <span className="text-[#C8D1DE]">{campaign.channels[0]}</span>
            {campaign.channels.length > 1 && (
              <span className="text-[#8E9BAE]"> +{campaign.channels.length - 1}</span>
            )}
          </span>
        </div>

        {/* Daily Stats Grid */}
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#080E1C] border border-[#14203B] rounded-lg text-center">
          <div>
            <span className="text-[10px] text-[#64748B] uppercase block">
              Disparos Hoje
            </span>
            <span className="text-xs font-bold font-mono-numeric text-[#E6E8EC]">
              {campaign.stats.dispatchesToday}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-[#64748B] uppercase block">
              Cliques
            </span>
            <span className="text-xs font-bold font-mono-numeric text-[#00C2FF]">
              {campaign.stats.clicksToday}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-[#64748B] uppercase block">
              Comissão
            </span>
            <span className="text-xs font-bold font-mono-numeric text-emerald-400">
              R$ {campaign.stats.commissionToday.toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer: Next Run & Actions */}
      <div className="pt-3.5 mt-3 border-t border-[#14203B] flex items-center justify-between gap-2">
        <div className="text-[11px] text-[#8E9BAE]">
          {isRunning ? (
            <span className="flex items-center gap-1 font-mono-numeric">
              <span className="text-[#64748B]">Próximo:</span>
              <span className="text-[#C8D1DE] font-medium">
                {campaign.nextExecution}
              </span>
            </span>
          ) : (
            <span className="text-[#64748B] italic">Execução suspensa</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onRunNow(campaign)}
            title="Disparar varredura desta campanha agora"
            className="p-1.5 rounded-lg border border-[#182B4E] bg-[#0E1A33] text-[#00C2FF] hover:bg-[#15254A] transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onOpenDetails(campaign)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#182B4E] bg-[#0E1A33] text-[#E6E8EC] hover:bg-[#15254A] hover:text-[#00C2FF] text-xs font-medium transition-colors cursor-pointer"
          >
            <span>Regras</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
