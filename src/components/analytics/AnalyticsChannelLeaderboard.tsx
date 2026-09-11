import React from 'react';
import { Radio, MessageSquare, MousePointerClick, DollarSign } from 'lucide-react';
import { ChannelAnalyticsItem } from '../../types';

interface AnalyticsChannelLeaderboardProps {
  channels: ChannelAnalyticsItem[];
}

export const AnalyticsChannelLeaderboard: React.FC<AnalyticsChannelLeaderboardProps> = ({
  channels,
}) => {
  return (
    <div className="bg-[#0A1020] border border-[#16233B] rounded-xl p-4.5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#14203B] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#00C2FF]" />
            <h3 className="font-semibold text-white text-sm">
              Ranking de Performance dos Canais
            </h3>
          </div>
          <p className="text-xs text-[#8E9BAE] mt-0.5">
            Engajamento e rentabilidade por grupo do WhatsApp e canais do Telegram
          </p>
        </div>
      </div>

      {/* Leaderboard list */}
      {channels.length === 0 ? (
        <div className="h-40 rounded-xl bg-[#0B1324] border border-[#162340] flex flex-col items-center justify-center gap-2 text-center">
          <Radio className="w-7 h-7 text-[#5A6470]" />
          <p className="text-xs text-[#8E9BAE]">
            Sem canais monitorados
          </p>
          <p className="text-[11px] text-[#64748B] max-w-xs">
            O ranking por canal aparecerá após vincular canais e registrar
            publicações.
          </p>
        </div>
      ) : (
      <div className="space-y-2.5">
        {channels.map((channel, idx) => {
          const isWhatsApp = channel.platform === 'WhatsApp';

          return (
            <div
              key={channel.id}
              className="p-3 bg-[#0B1220] border border-[#16233B] rounded-xl hover:border-[#1E3A6D] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Left: Position & Name */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    idx === 0
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : idx === 1
                      ? 'bg-slate-300 text-slate-950'
                      : idx === 2
                      ? 'bg-amber-700 text-white'
                      : 'bg-[#14203B] text-[#8E9BAE]'
                  }`}
                >
                  {idx + 1}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isWhatsApp ? 'bg-emerald-400' : 'bg-sky-400'
                      }`}
                    />
                    <p className="font-semibold text-white text-xs truncate max-w-[240px]">
                      {channel.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#8E9BAE] mt-0.5">
                    <span>{channel.platform}</span>
                    <span>&bull;</span>
                    <span>{channel.membersCount.toLocaleString()} membros</span>
                    <span>&bull;</span>
                    <span>{channel.messagesSent} mensagens enviadas</span>
                  </div>
                </div>
              </div>

              {/* Right: Metrics */}
              <div className="flex items-center gap-4 sm:gap-6 shrink-0 border-t sm:border-t-0 border-[#14203B] pt-2 sm:pt-0">
                <div className="text-right">
                  <span className="text-[10px] text-[#8E9BAE] block">Cliques:</span>
                  <span className="font-mono-numeric font-bold text-white text-xs">
                    {channel.clicks.toLocaleString()}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#8E9BAE] block">CTR:</span>
                  <span className="font-mono-numeric font-bold text-[#00C2FF] text-xs">
                    {channel.ctr}%
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#8E9BAE] block">Pedidos:</span>
                  <span className="font-mono-numeric font-bold text-indigo-300 text-xs">
                    {channel.orders}
                  </span>
                </div>

                <div className="text-right min-w-[90px]">
                  <span className="text-[10px] text-[#8E9BAE] block">Comissão:</span>
                  <span className="font-mono-numeric font-bold text-emerald-400 text-xs">
                    R$ {channel.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
