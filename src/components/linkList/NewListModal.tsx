import React, { useState, useEffect } from 'react';
import {
  Plus,
  ListChecks,
  Target,
  Eye,
  Zap,
  Repeat,
} from 'lucide-react';
import {
  LinkListDestination,
  LinkListRotation,
  LinkListFrequency,
  LINK_LIST_DAYS,
  DESTINATION_LABELS,
  ROTATION_LABELS,
} from '../../types/linkList';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

interface NewListModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: { id: string; name: string }[];
  onSave: (data: {
    name: string;
    description: string;
    campaignId: string | null;
    campaignName: string | null;
    destination: LinkListDestination;
    rotation: LinkListRotation;
    frequency: LinkListFrequency;
  }) => void;
}

const DESTINATION_OPTIONS: {
  value: LinkListDestination;
  label: string;
  icon: React.ElementType;
  desc: string;
}[] = [
  {
    value: 'manual',
    label: 'Análise manual',
    icon: Eye,
    desc: 'Cada link é revisado pelo operador antes de avançar.',
  },
  {
    value: 'campaign',
    label: 'Campanha',
    icon: Target,
    desc: 'Links aprovados são encaminhados para a campanha configurada.',
  },
  {
    value: 'queue',
    label: 'Fila de publicação',
    icon: Zap,
    desc: 'Links vão diretamente para a fila de publicação.',
  },
];

export const NewListModal: React.FC<NewListModalProps> = ({
  isOpen,
  onClose,
  campaigns,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [campaignId, setCampaignId] = useState<string>('');
  const [destination, setDestination] = useState<LinkListDestination>('manual');
  const [rotation, setRotation] = useState<LinkListRotation>('sequential');
  const [frequency, setFrequency] = useState<LinkListFrequency>({
    minIntervalMinutes: 10,
    maxPerHour: 6,
    maxPerDay: 30,
    windowStart: '08:00',
    windowEnd: '22:00',
    activeDays: [...LINK_LIST_DAYS],
  });

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setCampaignId('');
      setDestination('manual');
      setRotation('sequential');
      setFrequency({
        minIntervalMinutes: 10,
        maxPerHour: 6,
        maxPerDay: 30,
        windowStart: '08:00',
        windowEnd: '22:00',
        activeDays: [...LINK_LIST_DAYS],
      });
    }
  }, [isOpen]);

  const toggleDay = (day: string) => {
    setFrequency((prev) => ({
      ...prev,
      activeDays: prev.activeDays.includes(day)
        ? prev.activeDays.filter((d) => d !== day)
        : [...prev.activeDays, day],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const selectedCampaign = campaigns.find((c) => c.id === campaignId);
    onSave({
      name: name.trim(),
      description: description.trim(),
      campaignId: selectedCampaign ? selectedCampaign.id : null,
      campaignName: selectedCampaign ? selectedCampaign.name : null,
      destination,
      rotation,
      frequency,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Lista de Links"
      subtitle="Crie uma lista para adicionar ofertas e preparar o envio para a fila."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {/* Identificação */}
        <div className="space-y-3 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
            1. Identificação da Lista
          </span>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#172033]">
              Nome da lista <span className="text-rose-700">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Ofertas da semana"
              className="w-full h-9 px-3 bg-[#FFFFFF] border border-[#CBD5E1] rounded-lg text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#172033]">
              Descrição (opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito desta lista..."
              className="w-full p-2.5 bg-[#FFFFFF] border border-[#CBD5E1] rounded-lg text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#172033]">
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
              helperText="A lista pode ser associada a uma campanha que aplica as regras de distribuição."
            />
          </div>
        </div>

        {/* Destino após processamento */}
        <div className="space-y-3 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
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
                      ? 'bg-[#EFF6FF] border-[#BFDBFE]'
                      : 'bg-[#FFFFFF] border-[#E2E8F0] hover:border-[#BFDBFE]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      active
                        ? 'bg-[#2563EB]/15 border border-[#2563EB]/40'
                        : 'bg-[#E2E8F0] border border-[#BFDBFE]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        active ? 'text-[#2563EB]' : 'text-[#64748B]'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`text-xs font-medium block ${
                        active ? 'text-[#172033]' : 'text-[#94A3B8]'
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-[#64748B] mt-0.5 block">
                      {opt.desc}
                    </span>
                  </div>
                  {active && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-[#2563EB] mt-2 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rotação + Frequência */}
        <div className="space-y-3 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
            3. Rotação & Frequência
          </span>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#172033]">
              Ordem de envio (rotação)
            </label>
            <Select
              options={(
                Object.keys(ROTATION_LABELS) as LinkListRotation[]
              ).map((r) => ({
                value: r,
                label: ROTATION_LABELS[r],
              }))}
              value={rotation}
              onChange={(e) =>
                setRotation(e.target.value as LinkListRotation)
              }
              leftIcon={<Repeat className="w-3.5 h-3.5 text-[#64748B]" />}
            />
            <p className="text-[10px] text-[#64748B]">
              Define a ordem em que os links da lista serão publicados.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs text-[#64748B]">
                Intervalo mínimo (min)
              </label>
              <input
                type="number"
                min="1"
                value={frequency.minIntervalMinutes}
                onChange={(e) =>
                  setFrequency((prev) => ({
                    ...prev,
                    minIntervalMinutes:
                      parseInt(e.target.value) || 1,
                  }))
                }
                className="w-full h-8 px-3 bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#64748B]">Máximo por hora</label>
              <input
                type="number"
                min="1"
                value={frequency.maxPerHour}
                onChange={(e) =>
                  setFrequency((prev) => ({
                    ...prev,
                    maxPerHour: parseInt(e.target.value) || 1,
                  }))
                }
                className="w-full h-8 px-3 bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#64748B]">Máximo por dia</label>
              <input
                type="number"
                min="1"
                value={frequency.maxPerDay}
                onChange={(e) =>
                  setFrequency((prev) => ({
                    ...prev,
                    maxPerDay: parseInt(e.target.value) || 1,
                  }))
                }
                className="w-full h-8 px-3 bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-[#64748B]">Janela de horário</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="time"
                  value={frequency.windowStart}
                  onChange={(e) =>
                    setFrequency((prev) => ({
                      ...prev,
                      windowStart: e.target.value,
                    }))
                  }
                  className="h-8 px-2 bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg text-xs font-mono-numeric text-[#172033] focus:outline-none focus:border-[#2563EB]"
                />
                <span className="text-[10px] text-[#64748B]">até</span>
                <input
                  type="time"
                  value={frequency.windowEnd}
                  onChange={(e) =>
                    setFrequency((prev) => ({
                      ...prev,
                      windowEnd: e.target.value,
                    }))
                  }
                  className="h-8 px-2 bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg text-xs font-mono-numeric text-[#172033] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#64748B]">Dias da semana</label>
              <div className="flex flex-wrap gap-1.5">
                {LINK_LIST_DAYS.map((day) => {
                  const selected = frequency.activeDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`w-9 h-8 rounded-md text-[10px] font-semibold transition-colors border cursor-pointer ${
                        selected
                          ? 'bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]/40'
                          : 'bg-[#FFFFFF] text-[#64748B] border-[#CBD5E1] hover:border-[#93C5FD]'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
            <ListChecks className="w-3.5 h-3.5" />
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
              Criar Lista
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};