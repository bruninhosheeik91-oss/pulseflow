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
    <div className="bg-[#0B1324] border border-[#162340] rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[980px]">
          <thead>
            <tr className="border-b border-[#162340] bg-[#080E1C] text-[11px] font-semibold text-[#8E9BAE] uppercase tracking-wider">
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
          <tbody className="divide-y divide-[#121E38] text-xs">
            {channels.map((ch) => {
              const isWhatsApp = ch.platform === 'WhatsApp';
              const isConnected = ch.status === 'Conectado';
              const isAttention = ch.status === 'Atenção';
              const isPaused = ch.status === 'Pausado';

              return (
                <tr
                  key={ch.id}
                  className="hover:bg-[#0E172C]/60 transition-colors group cursor-pointer"
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
                        <span className="font-bold text-[#E6E8EC] group-hover:text-[#00C2FF] transition-colors truncate">
                          {ch.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                            isWhatsApp
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-[#0088cc]/15 border-[#0088cc]/35 text-[#38BDF8]'
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
                      <span className="text-xs text-[#C8D1DE] block font-medium">
                        {ch.type}
                      </span>
                      <span className="text-[11px] font-mono-numeric text-[#70A1FF] truncate block">
                        {ch.identifier}
                      </span>
                    </div>
                  </td>

                  {/* Instância / Sessão */}
                  <td className="py-3 px-3">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-[#E6E8EC]">
                        {ch.instanceName}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span
                          className={`px-1.5 py-0.2 rounded font-semibold ${
                            ch.instanceStatus === 'Online'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                              : ch.instanceStatus === 'Aguardando QR'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                          }`}
                        >
                          {ch.instanceStatus}
                        </span>
                        {ch.instanceBattery && (
                          <span className="text-[#8E9BAE] font-mono-numeric">
                            {ch.instanceBattery}% bat.
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Audiência */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#00C2FF] shrink-0" />
                      <div>
                        <span className="font-bold font-mono-numeric text-[#E6E8EC] block">
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
                      <div className="text-xs text-[#70A1FF] font-medium truncate">
                        {ch.linkedCampaigns[0] || 'Nenhuma'}
                      </div>
                      {ch.linkedCampaigns.length > 1 && (
                        <span className="text-[10px] text-[#8E9BAE] block">
                          +{ch.linkedCampaigns.length - 1} campanha(s)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Disparos Hoje */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-bold font-mono-numeric text-[#E6E8EC]">
                      {ch.stats.messagesToday} msgs
                    </span>
                    <span className="text-[10px] text-[#64748B] block font-mono-numeric">
                      {ch.stats.messagesTotal} total
                    </span>
                  </td>

                  {/* Cliques / Entrega */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-bold font-mono-numeric text-[#00C2FF]">
                      {ch.stats.clicksToday.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-[10px] text-emerald-400 block font-mono-numeric">
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
                        className="p-1.5 rounded-lg border border-[#182B4E] bg-[#0E1A33] text-[#00C2FF] hover:bg-[#15254A] transition-colors cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStatus(ch)}
                        title={isPaused ? 'Ativar canal' : 'Pausar canal'}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isPaused
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-[#0E1A33] border-[#182B4E] text-[#8E9BAE] hover:text-amber-400 hover:border-amber-500/30'
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
