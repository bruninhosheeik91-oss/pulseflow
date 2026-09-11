import React, { useState } from 'react';
import {
  X,
  Radio,
  MessageSquare,
  Send,
  Users,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Play,
  Pause,
  Zap,
  BatteryCharging,
  Layers,
  CheckCircle2,
  Copy,
  Check,
  Wifi,
  Activity,
  Edit3,
  ExternalLink,
} from 'lucide-react';
import { DistributionChannel } from '../../types';
import { MarketplaceBadge } from '../ui/MarketplaceBadge';
import { Button } from '../ui/Button';

interface ChannelDetailDrawerProps {
  channel: DistributionChannel | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleStatus: (channel: DistributionChannel) => void;
  onSendTestMessage: (channel: DistributionChannel) => void;
  onEdit: (channel: DistributionChannel) => void;
}

export const ChannelDetailDrawer: React.FC<ChannelDetailDrawerProps> = ({
  channel,
  isOpen,
  onClose,
  onToggleStatus,
  onSendTestMessage,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<
    'instance' | 'campaigns' | 'history' | 'simulator'
  >('instance');
  const [copiedId, setCopiedId] = useState(false);
  const [simulatedSending, setSimulatedSending] = useState(false);
  const [simulatedSuccess, setSimulatedSuccess] = useState(false);

  if (!isOpen || !channel) return null;

  const isWhatsApp = channel.platform === 'WhatsApp';
  const isConnected = channel.status === 'Conectado';
  const isAttention = channel.status === 'Atenção';
  const isPaused = channel.status === 'Pausado';

  const copyIdentifier = () => {
    navigator.clipboard?.writeText(channel.identifier);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSimulateTest = () => {
    setSimulatedSending(true);
    setSimulatedSuccess(false);
    setTimeout(() => {
      setSimulatedSending(false);
      setSimulatedSuccess(true);
      setTimeout(() => setSimulatedSuccess(false), 3500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-[#070C18] border-l border-[#162340] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#14203B] bg-[#0A1020] flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono-numeric text-xs font-semibold px-2 py-0.5 rounded bg-[#101F3D] text-[#00C2FF] border border-[#1C3A6E]">
                {channel.id}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold border ${
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
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  isConnected
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : isAttention
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                    : 'bg-[#151D2E] text-[#94A3B8] border border-[#1C2C47]'
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
            </div>
            <h2 className="text-base font-bold text-[#E6E8EC] truncate">
              {channel.name}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onToggleStatus(channel)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isPaused
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-[#0E1A33] border-[#182B4E] text-[#8E9BAE] hover:text-amber-400 hover:border-amber-500/30'
              }`}
            >
              {isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Ativar</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pausar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8E9BAE] hover:text-[#E6E8EC] hover:bg-[#121E38] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-5 border-b border-[#14203B] bg-[#080E1C] gap-6 text-xs font-semibold overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('instance')}
            className={`py-3 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'instance'
                ? 'border-[#00C2FF] text-[#00C2FF]'
                : 'border-transparent text-[#8E9BAE] hover:text-[#E6E8EC]'
            }`}
          >
            Telemetria & Instância
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('campaigns')}
            className={`py-3 border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'campaigns'
                ? 'border-[#00C2FF] text-[#00C2FF]'
                : 'border-transparent text-[#8E9BAE] hover:text-[#E6E8EC]'
            }`}
          >
            <span>Campanhas Vinculadas</span>
            <span className="font-mono-numeric text-[10px] px-1.5 py-0.2 rounded bg-[#101A30] text-[#70A1FF]">
              {channel.linkedCampaigns.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-[#00C2FF] text-[#00C2FF]'
                : 'border-transparent text-[#8E9BAE] hover:text-[#E6E8EC]'
            }`}
          >
            <span>Mensagens Recentes</span>
            <span className="font-mono-numeric text-[10px] px-1.5 py-0.2 rounded bg-[#101A30] text-[#70A1FF]">
              {channel.recentMessages.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`py-3 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'simulator'
                ? 'border-[#00C2FF] text-[#00C2FF]'
                : 'border-transparent text-[#8E9BAE] hover:text-[#E6E8EC]'
            }`}
          >
            Simulador de Disparo
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Performance Summary Strip */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#8E9BAE] uppercase tracking-wider">
              Métricas Operacionais
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-[#0B1324] border border-[#162340] rounded-xl text-center">
                <span className="text-[10px] text-[#64748B] uppercase block">
                  Audiência
                </span>
                <span className="text-sm font-bold font-mono-numeric text-[#E6E8EC]">
                  {channel.membersCount.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-[#8E9BAE] block">
                  {channel.type.includes('Canal') ? 'inscritos' : 'membros'}
                </span>
              </div>

              <div className="p-3 bg-[#0B1324] border border-[#162340] rounded-xl text-center">
                <span className="text-[10px] text-[#64748B] uppercase block">
                  Envios Hoje
                </span>
                <span className="text-sm font-bold font-mono-numeric text-[#00C2FF]">
                  {channel.stats.messagesToday} msgs
                </span>
                <span className="text-[10px] text-[#64748B] block font-mono-numeric">
                  {channel.stats.messagesTotal} total
                </span>
              </div>

              <div className="p-3 bg-[#0B1324] border border-[#162340] rounded-xl text-center">
                <span className="text-[10px] text-[#64748B] uppercase block">
                  Cliques Hoje
                </span>
                <span className="text-sm font-bold font-mono-numeric text-[#38BDF8]">
                  {channel.stats.clicksToday.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-[#64748B] block font-mono-numeric">
                  {channel.stats.clicksTotal.toLocaleString('pt-BR')} total
                </span>
              </div>

              <div className="p-3 bg-[#0B1324] border border-[#162340] rounded-xl text-center">
                <span className="text-[10px] text-[#64748B] uppercase block">
                  Taxa Entrega
                </span>
                <span className="text-sm font-bold font-mono-numeric text-emerald-400">
                  {channel.stats.deliveryRate}%
                </span>
                <span className="text-[10px] text-emerald-400 block font-mono-numeric">
                  {channel.stats.deliveryRate > 0 ? 'Sem bloqueios' : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* TAB 1: Telemetria & Instância */}
          {activeTab === 'instance' && (
            <div className="space-y-4">
              {/* Instância Box */}
              <div className="p-4 bg-[#0B1324] border border-[#162340] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#8E9BAE] uppercase tracking-wider block">
                    Instância de Comunicação
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      channel.instanceStatus === 'Online'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        channel.instanceStatus === 'Online'
                          ? 'bg-emerald-400 animate-pulse'
                          : 'bg-amber-400'
                      }`}
                    />
                    {channel.instanceStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-[#080E1C] border border-[#14203B] rounded-lg">
                    <span className="text-[10px] text-[#64748B] uppercase block">
                      Nome do Nó / Instância
                    </span>
                    <span className="text-xs font-bold text-[#E6E8EC] mt-0.5 block">
                      {channel.instanceName}
                    </span>
                  </div>

                  <div className="p-3 bg-[#080E1C] border border-[#14203B] rounded-lg">
                    <span className="text-[10px] text-[#64748B] uppercase block">
                      Latência do Socket
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Wifi className="w-3.5 h-3.5 text-[#8E9BAE]" />
                      <span className="text-xs font-bold font-mono-numeric text-[#8E9BAE]">
                        —
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#080E1C] border border-[#14203B] rounded-lg">
                    <span className="text-[10px] text-[#64748B] uppercase block">
                      Uptime da Sessão
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Activity className="w-3.5 h-3.5 text-[#8E9BAE]" />
                      <span className="text-xs font-bold font-mono-numeric text-[#8E9BAE]">
                        —
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#080E1C] border border-[#14203B] rounded-lg">
                    <span className="text-[10px] text-[#64748B] uppercase block">
                      Anti-Flood / Delay de Envio
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span className="text-xs font-bold font-mono-numeric text-[#38BDF8]">
                        {channel.antiFloodDelay} segundos de intervalo
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identificador e Endereçamento */}
              <div className="p-4 bg-[#0B1324] border border-[#162340] rounded-xl space-y-2">
                <span className="text-xs font-semibold text-[#8E9BAE] uppercase tracking-wider block">
                  Identificador Único (JID / Chat ID)
                </span>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#080E1C] border border-[#14203B]">
                  <span className="font-mono-numeric text-xs text-[#70A1FF] select-all">
                    {channel.identifier}
                  </span>
                  <button
                    type="button"
                    onClick={copyIdentifier}
                    className="p-1 rounded text-[#8E9BAE] hover:text-[#00C2FF] transition-colors cursor-pointer"
                    title="Copiar identificador"
                  >
                    {copiedId ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-[#8E9BAE]">
                  Utilizado internamente pelo motor de automação para rotear mensagens para o grupo ou canal sem necessidade de intervenção humana.
                </p>
              </div>

              {/* Descrição e Regras do Canal */}
              <div className="p-4 bg-[#0B1324] border border-[#162340] rounded-xl space-y-2">
                <span className="text-xs font-semibold text-[#8E9BAE] uppercase tracking-wider block">
                  Sobre esta Comunidade
                </span>
                <p className="text-xs text-[#C8D1DE] leading-relaxed">
                  {channel.description}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Campanhas Vinculadas */}
          {activeTab === 'campaigns' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8E9BAE] uppercase tracking-wider">
                  Campanhas Alimentando Este Canal
                </span>
                <span className="text-[11px] text-[#64748B]">
                  {channel.linkedCampaigns.length} ativas
                </span>
              </div>

              {channel.linkedCampaigns.length === 0 ? (
                <div className="p-8 text-center bg-[#0B1324] border border-[#162340] rounded-xl">
                  <Layers className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
                  <p className="text-xs text-[#8E9BAE]">
                    Nenhuma campanha vinculada a este canal no momento.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {channel.linkedCampaigns.map((camp, idx) => (
                    <div
                      key={camp}
                      className="p-3 bg-[#0B1324] border border-[#162340] rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#101F3D] border border-[#1B3666] flex items-center justify-center text-[#00C2FF] font-mono-numeric font-bold text-xs">
                          0{idx + 1}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#E6E8EC]">
                            {camp}
                          </h4>
                          <span className="text-[11px] text-[#8E9BAE]">
                            Disparo automatizado de ofertas com Deal Score aprovado
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ativa</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Histórico de Mensagens */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-[#8E9BAE] uppercase tracking-wider block">
                Últimas Mensagens Entregues
              </span>

              {channel.recentMessages.length === 0 ? (
                <div className="p-8 text-center bg-[#0B1324] border border-[#162340] rounded-xl">
                  <Clock className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
                  <p className="text-xs text-[#8E9BAE]">
                    Nenhuma mensagem registrada nas últimas 24 horas.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {channel.recentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3.5 bg-[#0B1324] border border-[#162340] rounded-xl space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {msg.marketplace && (
                            <MarketplaceBadge
                              marketplace={msg.marketplace}
                              size="xs"
                            />
                          )}
                          <span className="text-[#8E9BAE] font-mono-numeric text-[11px]">
                            {msg.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#00C2FF] font-mono-numeric font-medium">
                            {msg.clicks} cliques
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Entregue</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        {msg.productImage && (
                          <img
                            src={msg.productImage}
                            alt={msg.productName || 'Offer'}
                            className="w-14 h-14 rounded-lg object-cover bg-[#080E1C] border border-[#162340] shrink-0"
                          />
                        )}
                        <p className="text-xs text-[#C8D1DE] leading-relaxed bg-[#070C18] p-2.5 rounded-lg border border-[#14203B] flex-1">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Simulador de Disparo */}
          {activeTab === 'simulator' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#E6E8EC]">
                  Simulador de Envio Imediato
                </h4>
                <p className="text-[11px] text-[#8E9BAE]">
                  Envie uma mensagem de teste formatada agora para validar a entrega no nó do WhatsApp / Telegram.
                </p>
              </div>

              {/* Sample Deal Card to send */}
              <div className="p-4 bg-[#0A1629] border border-[#162F59] rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#00C2FF]">
                    Mensagem de teste
                  </span>
                </div>

                <div className="text-xs text-[#E6E8EC] font-sans space-y-1.5 leading-relaxed bg-[#07101E] p-3 rounded-lg border border-[#122342]">
                  <p className="font-bold text-[#FACC15]">
                    🚨 TESTE DE DISPARO
                  </p>
                  <p className="font-semibold text-white">
                    {'{produto}'}
                  </p>
                  <p className="text-[#8E9BAE]">
                    De R$ {'{preço_anterior}'} por <span className="text-emerald-400 font-bold">R$ {'{preço}'}</span>
                  </p>
                  <p className="text-[#00C2FF] font-mono-numeric text-[11px]">
                    Link afiliado de rastreio: {'{link_afiliado}'}
                  </p>
                </div>

                {simulatedSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2 text-xs animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      Mensagem de teste entregue com sucesso no canal {channel.name}.
                    </span>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSimulateTest}
                  disabled={simulatedSending}
                  leftIcon={<Zap className="w-3.5 h-3.5" />}
                  className="w-full text-xs font-semibold py-2 cursor-pointer"
                >
                  {simulatedSending
                    ? 'Conectando ao nó e enviando...'
                    : 'Disparar Mensagem de Teste Agora'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-[#14203B] bg-[#0A1020] flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(channel)}
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            className="text-xs border-[#182747] text-[#E6E8EC]"
          >
            Editar Configurações
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onSendTestMessage(channel)}
            leftIcon={<Zap className="w-3.5 h-3.5" />}
            className="text-xs font-semibold px-4"
          >
            Enviar Mensagem Teste
          </Button>
        </div>
      </div>
    </div>
  );
};
