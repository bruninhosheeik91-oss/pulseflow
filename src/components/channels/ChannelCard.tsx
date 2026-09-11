import React from 'react';
import {
  MessageSquare,
  Send,
  Users,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Play,
  Pause,
  ChevronRight,
  Zap,
  BatteryCharging,
  Layers,
} from 'lucide-react';
import { DistributionChannel } from '../../types';

interface ChannelCardProps {
  channel: DistributionChannel;
  onOpenDetails: (channel: DistributionChannel) => void;
  onToggleStatus: (channel: DistributionChannel) => void;
  onSendTestMessage: (channel: DistributionChannel) => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  onOpenDetails,
  onToggleStatus,
  onSendTestMessage,
}) => {
  const isWhatsApp = channel.platform === 'WhatsApp';
  const isConnected = channel.status === 'Conectado';
  const isAttention = channel.status === 'Atenção';
  const isPaused = channel.status === 'Pausado';

  return (
    <div className="bg-[#0B1324] border border-[#162340] hover:border-[#1E3A6E] rounded-xl p-4 transition-all duration-200 flex flex-col justify-between group shadow-xs">
      <div className="space-y-3.5">
        {/* Top Header: Platform, Type, Status & Quick Toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Platform Tag */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.8 rounded-md text-[11px] font-bold tracking-wide border ${
                isWhatsApp
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-[#0088cc]/15 border-[#0088cc]/35 text-[#38BDF8]'
              }`}
            >
              {isWhatsApp ? (
                <MessageSquare className="w-3 h-3 text-emerald-400" />
              ) : (
                <Send className="w-3 h-3 text-[#38BDF8]" />
              )}
              <span>{channel.platform}</span>
            </span>

            {/* Status Pill */}
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                  : isAttention
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                  : 'bg-[#151E33] text-[#8E9BAE] border border-[#1E2D4E]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected
                    ? 'bg-emerald-400 animate-pulse'
                    : isAttention
                    ? 'bg-amber-400'
                    : 'bg-[#64748B]'
                }`}
              />
              {channel.status}
            </span>

            {/* Channel Type */}
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#101A30] border border-[#182848] text-[#8E9BAE]">
              {channel.type}
            </span>
          </div>

          {/* Quick Pause / Activate Switch */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(channel);
            }}
            title={isPaused ? 'Ativar canal' : 'Pausar canal'}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
              isPaused
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-[#0E1B33] border-[#1B325E] text-[#8E9BAE] hover:text-amber-400 hover:border-amber-500/30'
            }`}
          >
            {isPaused ? (
              <Play className="w-3.5 h-3.5" />
            ) : (
              <Pause className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Channel Name & Description */}
        <div
          onClick={() => onOpenDetails(channel)}
          className="cursor-pointer space-y-1"
        >
          <h3 className="text-sm font-bold text-[#E6E8EC] group-hover:text-[#00C2FF] transition-colors leading-snug">
            {channel.name}
          </h3>
          <p className="text-xs text-[#8E9BAE] line-clamp-2 leading-relaxed">
            {channel.description}
          </p>
        </div>

        {/* Identifier & Instance info */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="px-2 py-0.5 rounded bg-[#0A1224] border border-[#162340] text-[#70A1FF] font-mono-numeric truncate max-w-[190px]">
            {channel.identifier}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#101A30] border border-[#182B4E] text-[#94A3B8] flex items-center gap-1">
            <span className="text-[#64748B]">Instância:</span>
            <span className="font-medium text-[#C8D1DE]">{channel.instanceName}</span>
          </span>
          {channel.instanceBattery && (
            <span className="px-1.5 py-0.5 rounded bg-[#0A1224] border border-[#162340] text-[#8E9BAE] flex items-center gap-1 text-[10px]">
              <BatteryCharging className="w-3 h-3 text-emerald-400" />
              <span>{channel.instanceBattery}%</span>
            </span>
          )}
        </div>

        {/* Audience & Anti-flood row */}
        <div className="flex items-center justify-between text-xs pt-0.5 text-[#8E9BAE]">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#00C2FF]" />
            <span className="font-mono-numeric font-bold text-[#E6E8EC]">
              {channel.membersCount.toLocaleString('pt-BR')}
            </span>
            <span className="text-[11px] text-[#64748B]">
              {channel.type.includes('Canal') ? 'inscritos' : 'membros'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <Clock className="w-3 h-3 text-[#64748B]" />
            <span>Anti-spam: {channel.antiFloodDelay}s</span>
          </div>
        </div>

        {/* Linked Campaigns */}
        <div className="pt-0.5 space-y-1">
          <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
            <Layers className="w-3 h-3 text-[#70A1FF]" />
            <span>{channel.linkedCampaigns.length} campanhas vinculadas:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {channel.linkedCampaigns.map((camp) => (
              <span
                key={camp}
                className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#101F3D] border border-[#1C3A6E] text-[#70A1FF] truncate max-w-[210px]"
                title={camp}
              >
                {camp}
              </span>
            ))}
          </div>
        </div>

        {/* Daily Performance Grid */}
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#080E1C] border border-[#14203B] rounded-lg text-center">
          <div>
            <span className="text-[10px] text-[#64748B] uppercase block">
              Envios Hoje
            </span>
            <span className="text-xs font-bold font-mono-numeric text-[#E6E8EC]">
              {channel.stats.messagesToday} msgs
            </span>
          </div>

          <div>
            <span className="text-[10px] text-[#64748B] uppercase block">
              Cliques Hoje
            </span>
            <span className="text-xs font-bold font-mono-numeric text-[#00C2FF]">
              {channel.stats.clicksToday.toLocaleString('pt-BR')}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-[#64748B] uppercase block">
              Taxa Entrega
            </span>
            <span className="text-xs font-bold font-mono-numeric text-emerald-400">
              {channel.stats.deliveryRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer: Last Send & Actions */}
      <div className="pt-3 mt-3 border-t border-[#14203B] flex items-center justify-between gap-2">
        <div className="text-[11px] text-[#8E9BAE]">
          <span className="flex items-center gap-1 font-mono-numeric">
            <span className="text-[#64748B]">Último envio:</span>
            <span className="text-[#C8D1DE] font-medium">
              {channel.stats.lastMessageTime}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSendTestMessage(channel)}
            title="Enviar mensagem de teste agora para este canal"
            className="p-1.5 rounded-lg border border-[#182B4E] bg-[#0E1A33] text-[#00C2FF] hover:bg-[#15254A] transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onOpenDetails(channel)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#182B4E] bg-[#0E1A33] text-[#E6E8EC] hover:bg-[#15254A] hover:text-[#00C2FF] text-xs font-medium transition-colors cursor-pointer"
          >
            <span>Detalhes</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
