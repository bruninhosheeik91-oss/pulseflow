import React from 'react';
import {
  MessageSquare,
  Send,
  Zap,
  Play,
  Pause,
  ChevronRight,
  Users,
  Clock,
  Layers,
} from 'lucide-react';
import { DistributionChannel } from '../../types';

interface ChannelTableProps {
  channels: DistributionChannel[];
  onOpenDetails: (channel: DistributionChannel) => void;
  onToggleStatus: (channel: DistributionChannel) => void;
  onSendTestMessage: (channel: DistributionChannel) => void;
}

export const ChannelTable: React.FC<ChannelTableProps> = ({
  channels,
  onOpenDetails,
  onToggleStatus,
  onSendTestMessage,
}) => {
  return (
    <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[980px]">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              <th className="py-3 px-4">Canal & Plataforma</th>
              <th className="py-3 px-3">Tipo & Identificador</th>
              <th className="py-3 px-3">Instância / Sessão</th>
              <th className="py-3 px-3">Audiência</th>
              <th className="py-3 px-3">Campanhas</th>
              <th className="py-3 px-3 text-center">Disparos Hoje</th>
              <th className="py-3 px-3 text-center">Cliques / Entrega</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFF6FF] text-xs">
            {channels.map((ch) => {
              const isWhatsApp = ch.platform === 'WhatsApp';
              const isConnected = ch.status === 'Conectado';
              const isAttention = ch.status === 'Atenção';
              const isPaused = ch.status === 'Pausado';

              return (
                <tr
                  key={ch.id}
                  className="hover:bg-[#FFFFFF]/60 transition-colors group cursor-pointer"
                  onClick={() => onOpenDetails(ch)}
                >
                  {/* Canal & Plataforma */}
                  <td className="py-3 px-4">
                    <div className="space-y-1 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isConnected
                              ? 'bg-emerald-400 animate-pulse'
                              : isAttention
                              ? 'bg-amber-400'
                              : 'bg-[#64748B]'
                          }`}
                        />
                        <span className="font-bold text-[#172033] group-hover:text-[#2563EB] transition-colors truncate">
                          {ch.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                            isWhatsApp
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                              : 'bg-[#F8FAFC]/15 border-[#E2E8F0]/35 text-[#3B82F6]'
                          }`}
                        >
                          {isWhatsApp ? (
                            <MessageSquare className="w-2.5 h-2.5" />
                          ) : (
                            <Send className="w-2.5 h-2.5" />
                          )}
                          <span>{ch.platform}</span>
                        </span>
                        <span className="text-[#334155]">•</span>
                        <span className="text-[10px] font-mono-numeric text-[#64748B]">
                          {ch.id}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Tipo & Identificador */}
                  <td className="py-3 px-3">
                    <div className="space-y-0.5 max-w-[180px]">
                      <span className="text-xs text-[#334155] block font-medium">
                        {ch.type}
                      </span>
                      <span className="text-[11px] font-mono-numeric text-[#2563EB] truncate block">
                        {ch.identifier}
                      </span>
                    </div>
                  </td>

                  {/* Instância / Sessão */}
                  <td className="py-3 px-3">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-[#172033]">
                        {ch.instanceName}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span
                          className={`px-1.5 py-0.2 rounded font-semibold ${
                            ch.instanceStatus === 'Online'
                              ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/25'
                              : ch.instanceStatus === 'Aguardando QR'
                              ? 'bg-amber-500/10 text-amber-700 border border-amber-500/25'
                              : 'bg-rose-500/10 text-rose-700 border border-rose-500/25'
                          }`}
                        >
                          {ch.instanceStatus}
                        </span>
                        {ch.instanceBattery && (
                          <span className="text-[#64748B] font-mono-numeric">
                            {ch.instanceBattery}% bat.
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Audiência */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                      <div>
                        <span className="font-bold font-mono-numeric text-[#172033] block">
                          {ch.membersCount.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[10px] text-[#64748B] block">
                          {ch.type.includes('Canal') ? 'inscritos' : 'membros'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Campanhas */}
                  <td className="py-3 px-3">
                    <div className="space-y-1 max-w-[170px]">
                      <div className="text-xs text-[#2563EB] font-medium truncate">
                        {ch.linkedCampaigns[0] || 'Nenhuma'}
                      </div>
                      {ch.linkedCampaigns.length > 1 && (
                        <span className="text-[10px] text-[#64748B] block">
                          +{ch.linkedCampaigns.length - 1} campanha(s)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Disparos Hoje */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-bold font-mono-numeric text-[#172033]">
                      {ch.stats.messagesToday} msgs
                    </span>
                    <span className="text-[10px] text-[#64748B] block font-mono-numeric">
                      {ch.stats.messagesTotal} total
                    </span>
                  </td>

                  {/* Cliques / Entrega */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-bold font-mono-numeric text-[#2563EB]">
                      {ch.stats.clicksToday.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-[10px] text-emerald-700 block font-mono-numeric">
                      {ch.stats.deliveryRate}% entrega
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
                        onClick={() => onSendTestMessage(ch)}
                        title="Enviar mensagem teste agora"
                        className="p-1.5 rounded-lg border border-[#DCE3EC] bg-[#F1F5F9] text-[#2563EB] hover:bg-[#DBEAFE] transition-colors cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStatus(ch)}
                        title={isPaused ? 'Ativar canal' : 'Pausar canal'}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isPaused
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/20'
                            : 'bg-[#F1F5F9] border-[#DCE3EC] text-[#64748B] hover:text-amber-700 hover:border-amber-500/30'
                        }`}
                      >
                        {isPaused ? (
                          <Play className="w-3.5 h-3.5" />
                        ) : (
                          <Pause className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenDetails(ch)}
                        title="Ver telemetria e histórico"
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
