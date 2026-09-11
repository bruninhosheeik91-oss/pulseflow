import React, { useState, useEffect } from 'react';
import { Plus, Eye, Target, Zap, Share2, MessageSquare } from 'lucide-react';
import {
  MirrorSource,
  MirrorSourceType,
  MirrorPlatform,
  MirrorDestination,
  DESTINATION_LABELS,
} from '../../types/mirror';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

export interface MirrorSourceDraft {
  name: string;
  type: MirrorSourceType;
  platform: MirrorPlatform;
  destination: MirrorDestination;
  campaignId: string | null;
  campaignName: string | null;
}

interface MirrorSourceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initial?: MirrorSource | null;
  campaigns: { id: string; name: string }[];
  onSave: (data: MirrorSourceDraft) => void;
}

const TYPE_OPTIONS: { value: MirrorSourceType; icon: React.ElementType }[] = [
  { value: 'Grupo', icon: Share2 },
  { value: 'Canal', icon: MessageSquare },
  { value: 'Outra fonte', icon: Target },
];

const DESTINATION_OPTIONS: {
  value: MirrorDestination;
  label: string;
  icon: React.ElementType;
  desc: string;
}[] = [
  {
    value: 'manual',
    label: 'Análise manual',
    icon: Eye,
    desc: 'Novas publicações são encaminhadas para revisão do operador.',
  },
  {
    value: 'campaign',
    label: 'Campanha',
    icon: Target,
    desc: 'Publicações processadas seguem para a campanha selecionada.',
  },
  {
    value: 'queue',
    label: 'Fila de Publicação',
    icon: Zap,
    desc: 'Publicações prontas entram diretamente na fila central.',
  },
];

export const MirrorSourceFormModal: React.FC<MirrorSourceFormModalProps> = ({
  isOpen,
  onClose,
  initial,
  campaigns,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<MirrorSourceType>('Grupo');
  const [platform, setPlatform] = useState<MirrorPlatform>('WhatsApp');
  const [destination, setDestination] = useState<MirrorDestination>('manual');
  const [campaignId, setCampaignId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setName(initial?.name ?? '');
      setType(initial?.type ?? 'Grupo');
      setPlatform(initial?.platform ?? 'WhatsApp');
      setDestination(initial?.destination ?? 'manual');
      setCampaignId(initial?.campaignId ?? '');
    }
  }, [isOpen, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const selectedCampaign = campaigns.find((c) => c.id === campaignId);
    onSave({
      name: name.trim(),
      type,
      platform,
      destination,
      campaignId: selectedCampaign ? selectedCampaign.id : null,
      campaignName: selectedCampaign ? selectedCampaign.name : null,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Editar fonte monitorada' : 'Nova fonte monitorada'}
      subtitle="Configure uma fonte que poderá preparar novas ofertas para sua operação."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {/* Identificação */}
        <div className="space-y-3 p-3.5 bg-[#0A1020] border border-[#162340] rounded-xl">
          <span className="text-xs font-semibold text-[#8E9BAE] uppercase tracking-wider block">
            1. Fonte monitorada
          </span>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#E6E8EC]">
              Nome da fonte <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Grupo de ofertas — VIP"
              className="w-full h-9 px-3 bg-[#070C18] border border-[#1A2C4E] rounded-lg text-xs text-[#E6E8EC] placeholder:text-[#64748B] focus:outline-none focus:border-[#1E5EFF]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#E6E8EC]">Tipo</label>
              <div className="grid grid-cols-3 gap-1.5">
                {TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setType(opt.value)}
                      className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#121E38] border-[#1E325C]'
                          : 'bg-[#070C18] border-[#162340] hover:border-[#1E3360]'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          active ? 'text-[#00C2FF]' : 'text-[#64748B]'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-medium ${
                          active ? 'text-[#E6E8EC]' : 'text-[#94A3B8]'
                        }`}
                      >
                        {opt.value}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#E6E8EC]">
                Plataforma
              </label>
              <Select
                options={[
                  { value: 'WhatsApp', label: 'WhatsApp' },
                  { value: 'Telegram', label: 'Telegram' },
                  { value: 'Outra', label: 'Outra' },
                ]}
                value={platform}
                onChange={(e) => setPlatform(e.target.value as MirrorPlatform)}
                helperText="Plataforma onde a fonte está hospedada."
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[#8E9BAE]">
              Acompanhamento
            </label>
            <p className="text-[10px] text-[#64748B] leading-relaxed">
              Nenhuma credencial é solicitada nesta etapa. A monitoração de novas
              publicações será ativada quando houver integração tecnicamente
              suportada.
            </p>
          </div>
        </div>

        {/* Destino após processamento */}
        <div className="space-y-3 p-3.5 bg-[#0A1020] border border-[#162340] rounded-xl">
          <span className="text-xs font-semibold text-[#8E9BAE] uppercase tracking-wider block">
            2. Destino após processamento
          </span>
          <div className="space-y-2">
            {DESTINATION_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = destination === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDestination(opt.value)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left cursor-pointer ${
                    active
                      ? 'bg-[#121E38] border-[#1E325C]'
                      : 'bg-[#070C18] border-[#162340] hover:border-[#1E3360]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      active
                        ? 'bg-[#1E5EFF]/15 border border-[#1E5EFF]/40'
                        : 'bg-[#14203B] border border-[#1E3057]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        active ? 'text-[#00C2FF]' : 'text-[#64748B]'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`text-xs font-medium block ${
                        active ? 'text-[#E6E8EC]' : 'text-[#94A3B8]'
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-[#64748B] mt-0.5 block">
                      {opt.desc}
                    </span>
                  </div>
                  {active && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-[#00C2FF] mt-2 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {destination === 'campaign' && (
            <div className="space-y-1 pt-1">
              <label className="text-xs font-medium text-[#E6E8EC]">
                Campanha
              </label>
              <Select
                options={
                  campaigns.length > 0
                    ? [
                        { value: '', label: 'Nenhuma campanha associada' },
                        ...campaigns.map((c) => ({ value: c.id, label: c.name })),
                      ]
                    : [{ value: '', label: 'Nenhuma campanha criada ainda' }]
                }
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                helperText="Somente campanhas existentes são utilizadas."
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-[#14203B]">
          <div className="flex items-center gap-2 text-[11px] text-[#8E9BAE]">
            <Target className="w-3.5 h-3.5" />
            <span>
              Destino: {DESTINATION_LABELS[destination]}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              disabled={!name.trim()}
              className="text-xs font-semibold px-4"
            >
              {initial ? 'Salvar Alterações' : 'Adicionar Fonte'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};