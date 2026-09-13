import React from 'react';
import {
  X,
  Share2,
  MessageSquare,
  Target,
  AlertTriangle,
  Inbox,
  Play,
  Pause,
  Pencil,
  Trash2,
  Repeat,
  ShieldCheck,
  ListChecks,
} from 'lucide-react';
import {
  MirrorSource,
  MirrorStatus,
  MirrorProcessingConfig,
  MirrorDedupConfig,
  PROCESSING_STEPS,
  DEDUP_OPTIONS,
  DESTINATION_LABELS,
  STATUS_LABELS,
} from '../../types/mirror';
import { Button } from '../ui/Button';

interface MirrorSourceDrawerProps {
  source: MirrorSource;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<MirrorSource>) => void;
  onToggleStatus: (id: string) => void;
  onEdit: (source: MirrorSource) => void;
  onDelete: (id: string) => void;
}

const TYPE_ICONS = {
  Grupo: Share2,
  Canal: MessageSquare,
  'Outra fonte': Target,
};

const STATUS_STYLE: Record<MirrorStatus, string> = {
  not_configured: 'bg-amber-500/10 border border-amber-500/30 text-amber-700',
  configured: 'bg-[#2563EB]/10 border border-[#2563EB]/30 text-[#2563EB]',
  paused: 'bg-[#F1F5F9] text-[#94A3B8] border border-[#CBD5E1]',
  requires_integration: 'bg-amber-500/10 border border-amber-500/30 text-amber-700',
};

interface ToggleRowProps {
  checked: boolean;
  label: string;
  description?: string;
  onToggle: () => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({
  checked,
  label,
  description,
  onToggle,
}) => (
  <button
    type="button"
    onClick={onToggle}
    className="w-full flex items-start justify-between gap-3 py-2 text-left cursor-pointer group"
  >
    <div className="min-w-0">
      <span className="text-xs font-medium text-[#172033] block group-hover:text-white">
        {label}
      </span>
      {description && (
        <span className="text-[10px] text-[#64748B] mt-0.5 block leading-relaxed">
          {description}
        </span>
      )}
    </div>
    <span
      className={`relative w-9 h-5 rounded-full shrink-0 transition-colors mt-0.5 ${
        checked ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
          checked ? 'left-[18px]' : 'left-0.5 bg-[#64748B]'
        }`}
      />
    </span>
  </button>
);

interface RadioRowProps<T extends string> {
  value: T;
  label: string;
  description?: string;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

function RadioRow<T extends string>({
  value,
  label,
  description,
  options,
  onChange,
}: RadioRowProps<T>) {
  return (
    <div className="py-2">
      <span className="text-xs font-medium text-[#172033] block">{label}</span>
      {description && (
        <span className="text-[10px] text-[#64748B] mt-0.5 block leading-relaxed">
          {description}
        </span>
      )}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
              value === opt.value
                ? 'bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]/40'
                : 'bg-[#FFFFFF] text-[#94A3B8] border-[#CBD5E1] hover:border-[#93C5FD]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const SectionCard: React.FC<{
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}> = ({ title, icon: Icon, children }) => (
  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
    <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0] mb-1">
      <Icon className="w-4 h-4 text-[#2563EB]" />
      <h3 className="text-xs font-semibold text-[#172033] uppercase tracking-wider">
        {title}
      </h3>
    </div>
    <div className="divide-y divide-[#F1F5F9]">{children}</div>
  </div>
);

export const MirrorSourceDrawer: React.FC<MirrorSourceDrawerProps> = ({
  source,
  onClose,
  onUpdate,
  onToggleStatus,
  onEdit,
  onDelete,
}) => {
  const TypeIcon = TYPE_ICONS[source.type];
  const enabledSteps = PROCESSING_STEPS.filter(
    (s) => source.processing[s.key]
  ).length;

  const updateProcessing = (key: keyof MirrorProcessingConfig) =>
    onUpdate(source.id, {
      processing: {
        ...source.processing,
        [key]: !source.processing[key],
      },
    });

  const updateDedup = (key: keyof MirrorDedupConfig) =>
    onUpdate(source.id, {
      dedup: {
        ...source.dedup,
        [key]: !source.dedup[key],
      },
    });

  const handleDelete = () => {
    if (window.confirm(`Excluir a fonte "${source.name}"?`)) {
      onDelete(source.id);
    }
  };

  const isPaused = source.status === 'paused';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-[#FFFFFF] border-l border-[#E2E8F0] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold border border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]">
                  <TypeIcon className="w-3 h-3 mr-0.5" />
                  <span>
                    {source.type} · {source.platform}
                  </span>
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLE[source.status]}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      source.status === 'configured'
                        ? 'bg-[#2563EB] animate-pulse'
                        : source.status === 'paused'
                        ? 'bg-[#94A3B8]'
                        : 'bg-amber-400'
                    }`}
                  />
                  {STATUS_LABELS[source.status]}
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#172033] tracking-tight mt-2">
                {source.name}
              </h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                <span className="font-mono-numeric">{source.id}</span>
                <span className="mx-1.5 text-[#93C5FD]">•</span>
                Origem: Espelhamento
                <span className="mx-1.5 text-[#93C5FD]">•</span>
                Criada em {source.createdAt}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-[#E2E8F0] scrollbar-track-transparent">
          {/* Integration banner */}
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-amber-500/[0.07] border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700/90 leading-relaxed">
              <span className="font-semibold text-amber-700">
                Requer integração.
              </span>{' '}
              Nenhuma leitura externa é realizada nesta etapa. A monitoração de
              novas publicações será ativada apenas quando houver integração
              tecnicamente suportada.
            </p>
          </div>

          {/* Destino e status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                Destino após processamento
              </span>
              <span className="text-sm font-bold text-[#172033] mt-1.5 block">
                {DESTINATION_LABELS[source.destination]}
              </span>
              <span className="text-[11px] text-[#64748B] mt-1 block">
                {source.destination === 'campaign'
                  ? source.campaignName ?? 'Nenhuma campanha associada'
                  : source.destination === 'queue'
                  ? 'Itens entram na fila central de publicação'
                  : 'Itens são encaminhados para revisão manual'}
              </span>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                Processamento
              </span>
              <span className="text-sm font-bold text-[#172033] mt-1.5 block">
                {enabledSteps} de {PROCESSING_STEPS.length} etapas
              </span>
              <span className="text-[11px] text-[#64748B] mt-1 block">
                configuração local · nada é executado nesta etapa
              </span>
            </div>
          </div>

          {/* Configuração do processamento */}
          <SectionCard
            title="Configuração do processamento"
            icon={ListChecks}
          >
            {PROCESSING_STEPS.map((step) => (
              <ToggleRow
                key={step.key}
                checked={source.processing[step.key]}
                label={step.label}
                onToggle={() => updateProcessing(step.key)}
              />
            ))}
          </SectionCard>

          {/* Tratamento da mensagem */}
          <SectionCard title="Tratamento da mensagem" icon={Repeat}>
            <RadioRow
              value={source.handling.text}
              label="Texto"
              description="Como o texto da publicação original deve ser tratado."
              onChange={(v) =>
                onUpdate(source.id, {
                  handling: { ...source.handling, text: v },
                })
              }
              options={[
                { value: 'preserve', label: 'Preservar original' },
                { value: 'template', label: 'Usar template' },
                { value: 'review', label: 'Preparar para revisão' },
              ]}
            />
            <RadioRow
              value={source.handling.link}
              label="Link"
              description="O que fazer com o link identificado na publicação."
              onChange={(v) =>
                onUpdate(source.id, {
                  handling: { ...source.handling, link: v },
                })
              }
              options={[
                { value: 'preserve', label: 'Preservar' },
                { value: 'affiliate', label: 'Preparar link de afiliado' },
              ]}
            />
            <RadioRow
              value={source.handling.media}
              label="Mídia"
              onChange={(v) =>
                onUpdate(source.id, {
                  handling: { ...source.handling, media: v },
                })
              }
              options={[
                { value: 'preserve', label: 'Preservar quando suportado' },
                { value: 'ignore', label: 'Não utilizar' },
              ]}
            />
          </SectionCard>

          {/* Proteção contra duplicidade */}
          <SectionCard
            title="Proteção contra duplicidade"
            icon={ShieldCheck}
          >
            {DEDUP_OPTIONS.map((opt) => (
              <ToggleRow
                key={opt.key}
                checked={source.dedup[opt.key]}
                label={opt.label}
                description={opt.description}
                onToggle={() => updateDedup(opt.key)}
              />
            ))}
            <p className="text-[10px] text-[#64748B] pt-2 leading-relaxed">
              Configuração visual apenas — sem algoritmo real nesta etapa.
            </p>
          </SectionCard>

          {/* Atividade */}
          <SectionCard title="Atividade" icon={Inbox}>
            <div className="py-6 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center mb-2">
                <Inbox className="w-4 h-4 text-[#64748B]" />
              </div>
              <span className="text-xs font-semibold text-[#64748B]">
                Nenhuma publicação processada.
              </span>
              <p className="text-[10px] text-[#64748B] mt-1 max-w-[240px] leading-relaxed">
                Publicações só passam a ser registradas quando houver integração
                configurada.
              </p>
            </div>
          </SectionCard>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Button
              variant={isPaused ? 'primary' : 'outline'}
              size="sm"
              leftIcon={
                isPaused ? (
                  <Play className="w-3.5 h-3.5" />
                ) : (
                  <Pause className="w-3.5 h-3.5" />
                )
              }
              onClick={() => onToggleStatus(source.id)}
              className="text-xs"
            >
              {isPaused ? 'Retomar' : 'Pausar'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Pencil className="w-3.5 h-3.5" />}
              onClick={() => onEdit(source)}
              className="text-xs"
            >
              Editar
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={handleDelete}
              className="text-xs text-red-700 hover:text-red-700"
            >
              Excluir
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};