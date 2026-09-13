import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  QrCode,
  Smartphone,
  Bot,
  Clock,
  Save,
  Plus,
  Radio,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import {
  DistributionChannel,
  ChannelPlatform,
  ChannelType,
} from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface ChannelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveChannel: (channelData: Partial<DistributionChannel>) => void;
  initialChannel?: DistributionChannel | null;
}

const AVAILABLE_CAMPAIGNS: string[] = [];

export const ChannelFormModal: React.FC<ChannelFormModalProps> = ({
  isOpen,
  onClose,
  onSaveChannel,
  initialChannel,
}) => {
  const [platform, setPlatform] = useState<ChannelPlatform>('WhatsApp');
  const [channelType, setChannelType] = useState<ChannelType>('Grupo WhatsApp');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [instanceName, setInstanceName] = useState('');
  const [antiFloodDelay, setAntiFloodDelay] = useState(30);
  const [membersCount, setMembersCount] = useState<string>('');
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [showQrSimulation, setShowQrSimulation] = useState(false);

  useEffect(() => {
    if (initialChannel) {
      setPlatform(initialChannel.platform);
      setChannelType(initialChannel.type);
      setName(initialChannel.name);
      setDescription(initialChannel.description);
      setIdentifier(initialChannel.identifier);
      setInstanceName(initialChannel.instanceName);
      setAntiFloodDelay(initialChannel.antiFloodDelay);
      setMembersCount(String(initialChannel.membersCount));
      setSelectedCampaigns(initialChannel.linkedCampaigns);
      setShowQrSimulation(false);
    } else {
      setPlatform('WhatsApp');
      setChannelType('Grupo WhatsApp');
      setName('');
      setDescription('');
      setIdentifier('');
      setInstanceName('');
      setAntiFloodDelay(30);
      setMembersCount('');
      setSelectedCampaigns([]);
      setShowQrSimulation(false);
    }
  }, [initialChannel, isOpen]);

  const handlePlatformChange = (p: ChannelPlatform) => {
    setPlatform(p);
    if (p === 'WhatsApp') {
      setChannelType('Grupo WhatsApp');
      setInstanceName('');
      if (!identifier.includes('@g.us')) {
        setIdentifier('');
      }
    } else {
      setChannelType('Canal Telegram');
      setInstanceName('');
      if (!identifier.startsWith('@')) {
        setIdentifier('@');
      }
    }
  };

  const toggleCampaign = (camp: string) => {
    setSelectedCampaigns((prev) =>
      prev.includes(camp) ? prev.filter((c) => c !== camp) : [...prev, camp]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveChannel({
      name,
      platform,
      type: channelType,
      description:
        description ||
        `Canal de distribuição para ofertas automatizadas no ${platform}.`,
      identifier,
      instanceName,
      instanceStatus: 'Offline',
      antiFloodDelay,
      membersCount: Number(membersCount) || 0,
      linkedCampaigns: selectedCampaigns,
      status: 'Pausado',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialChannel ? 'Editar Canal' : 'Conectar Novo Canal ou Grupo'}
      subtitle="Conecte grupos e canais do WhatsApp ou Telegram ao motor de distribuição da PULSE FLOW."
      maxWidth="lg"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-h-[75vh] overflow-y-auto pr-1"
      >
        {/* 1. Escolha da Plataforma */}
        <div className="space-y-3 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
            1. Plataforma de Distribuição
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={() => handlePlatformChange('WhatsApp')}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                platform === 'WhatsApp'
                  ? 'bg-[#F8FAFC] border-emerald-500/50 text-white shadow-xs'
                  : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:border-[#BFDBFE]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-white">
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                  <span>WhatsApp</span>
                </div>
                {platform === 'WhatsApp' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                )}
              </div>
              <p className="text-[11px] text-[#64748B] mt-1">
                Grupos abertos/fechados ou canais de transmissão oficiais.
              </p>
            </button>

            {/* Telegram */}
            <button
              type="button"
              onClick={() => handlePlatformChange('Telegram')}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                platform === 'Telegram'
                  ? 'bg-[#EFF6FF] border-[#2563EB]/50 text-white shadow-xs'
                  : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:border-[#BFDBFE]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-white">
                  <Send className="w-4 h-4 text-[#2563EB]" />
                  <span>Telegram</span>
                </div>
                {platform === 'Telegram' && (
                  <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
                )}
              </div>
              <p className="text-[11px] text-[#64748B] mt-1">
                Canais públicos ou privados com bot administrativo.
              </p>
            </button>
          </div>

          {/* Tipo de Canal */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-medium text-[#172033]">
              Tipo de Comunidade
            </label>
            <div className="grid grid-cols-2 gap-2">
              {platform === 'WhatsApp' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setChannelType('Grupo WhatsApp')}
                    className={`px-3 py-2 rounded-lg border text-xs text-left transition-colors cursor-pointer ${
                      channelType === 'Grupo WhatsApp'
                        ? 'bg-[#DBEAFE] border-[#2563EB] text-white font-semibold'
                        : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    Grupo do WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannelType('Canal WhatsApp')}
                    className={`px-3 py-2 rounded-lg border text-xs text-left transition-colors cursor-pointer ${
                      channelType === 'Canal WhatsApp'
                        ? 'bg-[#DBEAFE] border-[#2563EB] text-white font-semibold'
                        : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    Canal (Newsletter)
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setChannelType('Canal Telegram')}
                    className={`px-3 py-2 rounded-lg border text-xs text-left transition-colors cursor-pointer ${
                      channelType === 'Canal Telegram'
                        ? 'bg-[#DBEAFE] border-[#2563EB] text-white font-semibold'
                        : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    Canal Público / Privado
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannelType('Supergrupo Telegram')}
                    className={`px-3 py-2 rounded-lg border text-xs text-left transition-colors cursor-pointer ${
                      channelType === 'Supergrupo Telegram'
                        ? 'bg-[#DBEAFE] border-[#2563EB] text-white font-semibold'
                        : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    Supergrupo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 2. Identificação e Endereçamento */}
        <div className="space-y-3 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
            2. Identificação do Canal
          </span>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#172033]">
              Nome de Exibição <span className="text-rose-700">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                platform === 'WhatsApp'
                  ? 'Ex: WhatsApp Ofertas Gamer & Hardware VIP'
                  : 'Ex: Telegram Radar de Ofertas Geral'
              }
              className="w-full h-9 px-3 bg-[#FFFFFF] border border-[#CBD5E1] rounded-lg text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#172033]">
                Identificador / Link JID
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  platform === 'WhatsApp'
                    ? '1203630...2910@g.us ou link do grupo'
                    : '@nome_do_canal'
                }
                className="w-full h-9 px-3 bg-[#FFFFFF] border border-[#CBD5E1] rounded-lg text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#172033]">
                Membros / Inscritos Estimados
              </label>
              <input
                type="number"
                value={membersCount}
                onChange={(e) => setMembersCount(e.target.value)}
                placeholder="Ex: 850"
                className="w-full h-9 px-3 bg-[#FFFFFF] border border-[#CBD5E1] rounded-lg text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#172033]">
              Descrição do Canal
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o público-alvo ou nicho de atuação deste canal..."
              className="w-full p-2.5 bg-[#FFFFFF] border border-[#CBD5E1] rounded-lg text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        {/* 3. Instância & Integração */}
        <div className="space-y-3 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
              3. Instância & Conexão de Envio
            </span>
            {platform === 'WhatsApp' && (
              <button
                type="button"
                onClick={() => setShowQrSimulation(!showQrSimulation)}
                className="text-[11px] text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>
                  {showQrSimulation ? 'Ocultar QR Code' : 'Escanear QR Code'}
                </span>
              </button>
            )}
          </div>

          {/* QR Code Simulator if toggled */}
          {showQrSimulation && platform === 'WhatsApp' && (
            <div className="p-4 bg-[#F8FAFC] border border-[#93C5FD] rounded-xl text-center space-y-3 animate-in fade-in duration-200">
              <div className="w-32 h-32 bg-white p-2 rounded-xl mx-auto flex items-center justify-center shadow-lg">
                <div className="w-full h-full border-4 border-black border-dashed flex items-center justify-center">
                  <QrCode className="w-20 h-20 text-black" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-white">
                  Aponte a câmera do WhatsApp para escanear
                </p>
                <p className="text-[11px] text-[#64748B] max-w-xs mx-auto">
                  Abra o WhatsApp &gt; Aparelhos conectados &gt; Conectar um aparelho para vincular a esta instância.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
                <CheckCircle2 className="w-3 h-3" />
                <span>Sessão pronta para autenticação</span>
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#172033]">
                Instância Selecionada
              </label>
              {platform === 'WhatsApp' ? (
                <select
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  className="w-full h-9 px-2 bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="">Selecione uma instância</option>
                  <option value="Evolution Node BR #01">
                    Evolution Node BR #01
                  </option>
                  <option value="Z-API Cluster BR #02">
                    Z-API Cluster BR #02
                  </option>
                  <option value="Baileys Multi-Device #03">
                    Baileys Multi-Device #03
                  </option>
                  <option value="Nova Instância Dedicada">
                    + Criar Nova Instância Dedicada
                  </option>
                </select>
              ) : (
                <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#DCE3EC] text-xs text-[#172033] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#2563EB]" />
                    <span>Bot @PulseFlowBot</span>
                  </div>
                  <span className="text-[10px] text-[#64748B] font-semibold">
                    —
                  </span>
                </div>
              )}
            </div>

            {/* Anti-Flood Delay */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#172033]">
                  Anti-Flood (Delay Mínimo)
                </span>
                <span className="font-mono-numeric font-bold text-[#2563EB]">
                  {antiFloodDelay}s
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={antiFloodDelay}
                onChange={(e) => setAntiFloodDelay(Number(e.target.value))}
                className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#2563EB] mt-2"
              />
            </div>
          </div>
        </div>

        {/* 4. Campanhas Vinculadas */}
        <div className="space-y-3 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
            4. Vincular a Campanhas Existentes
          </span>

          <div className="space-y-1.5">
            {AVAILABLE_CAMPAIGNS.length === 0 && (
              <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#DCE3EC] text-xs text-[#64748B]">
                Nenhuma campanha criada ainda. Vincule este canal após criar
                campanhas em Automações &gt; Campanhas.
              </div>
            )}
            {AVAILABLE_CAMPAIGNS.map((camp) => {
              const active = selectedCampaigns.includes(camp);
              return (
                <button
                  key={camp}
                  type="button"
                  onClick={() => toggleCampaign(camp)}
                  className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#DBEAFE] border-[#2563EB] text-white font-medium'
                      : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:border-[#BFDBFE]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>{camp}</span>
                  </div>
                  {active && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            leftIcon={
              initialChannel ? (
                <Save className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )
            }
            className="text-xs font-semibold px-4"
          >
            {initialChannel ? 'Salvar Configurações' : 'Conectar Canal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
