import React, { useState } from 'react';
import {
  Users,
  ArrowDown,
  ArrowRight,
  Pause,
  Play,
  Pencil,
  Link2,
  MessageSquare,
  Send,
  Inbox,
  ListChecks,
  Repeat,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Unlink,
} from 'lucide-react';
import {
  MonitorGroupConfig,
  MonitorGroupStatus,
  MonitorOrder,
  MonitorDistributionTarget,
  MonitorGroupRules,
  MonitorGroupProcessing,
  PROCESSING_STEPS,
  DEFAULT_RULES,
  DEFAULT_PROCESSING,
} from '../../types/monitorGroup';
import { DistributionChannel } from '../../types';
import { Badge, BadgeProps } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { initialChannels } from '../../data/mockChannels';
import {
  MonitorGroupFormModal,
  MonitorGroupDraft,
} from './MonitorGroupFormModal';
import { LinkedGroupsModal } from './LinkedGroupsModal';

const PLATFORM_ICONS = {
  WhatsApp: MessageSquare,
  Telegram: Send,
  Outra: Users,
};

const STATUS_BADGE: Record<
  MonitorGroupStatus,
  NonNullable<BadgeProps['variant']>
> = {
  not_configured: 'warning',
  configured: 'info',
  paused: 'neutral',
  requires_integration: 'warning',
};

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info';
}

export const MonitorGroupPage: React.FC = () => {
  const [config, setConfig] = useState<MonitorGroupConfig | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<
    { name: string; platform: MonitorGroupConfig['platform']; identifier: string } | null
  >(null);
  const [linkedModalOpen, setLinkedModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const channels = initialChannels;
  const linkedChannels = channels.filter((c) =>
    config?.linkedGroupIds.includes(c.id)
  );

  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = () => {
    if (!config) return;
    setEditing({
      name: config.name,
      platform: config.platform,
      identifier: config.identifier,
    });
    setFormOpen(true);
  };

  const handleSaveConfig = (data: MonitorGroupDraft) => {
    if (editing && config) {
      setConfig((prev) =>
        prev ? { ...prev, ...data } : prev
      );
      showToast('Grupo Monitor atualizado.');
    } else {
      const created: MonitorGroupConfig = {
        id: `MONITOR-${Date.now().toString(36).toUpperCase()}`,
        ...data,
        status: 'configured',
        linkedGroupIds: [],
        rules: { ...DEFAULT_RULES },
        processing: { ...DEFAULT_PROCESSING },
        createdAt: new Date().toLocaleDateString('pt-BR'),
        automationSource: 'MONITOR_GROUP',
      };
      setConfig(created);
      showToast('Grupo Monitor configurado. Vincule seus grupos.');
    }
  };

  const updateRules = (patch: Partial<MonitorGroupRules>) => {
    setConfig((prev) =>
      prev ? { ...prev, rules: { ...prev.rules, ...patch } } : prev
    );
  };

  const updateProcessing = (key: keyof MonitorGroupProcessing) => {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            processing: { ...prev.processing, [key]: !prev.processing[key] },
          }
        : prev
    );
  };

  const handleToggleStatus = () => {
    if (!config) return;
    const next = config.status === 'paused' ? 'configured' : 'paused';
    setConfig((prev) => (prev ? { ...prev, status: next } : prev));
    showToast(
      next === 'paused' ? 'Grupo Monitor pausado.' : 'Grupo Monitor retomado.',
      'info'
    );
  };

  const handleSaveLinks = (ids: string[]) => {
    setConfig((prev) => (prev ? { ...prev, linkedGroupIds: ids } : prev));
    showToast(
      ids.length > 0
        ? `${ids.length} grupo(s) vinculado(s).`
        : 'Nenhum grupo vinculado.',
      'info'
    );
  };

  const unlinkChannel = (id: string) => {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            linkedGroupIds: prev.linkedGroupIds.filter((x) => x !== id),
          }
        : prev
    );
    showToast('Grupo desvinculado.', 'info');
  };

  const toggleSelected = (id: string) => {
    if (!config) return;
    const ids = config.rules.selectedGroupIds;
    updateRules({
      selectedGroupIds: ids.includes(id)
        ? ids.filter((x) => x !== id)
        : [...ids, id],
    });
  };

  const ToggleRow: React.FC<{
    checked: boolean;
    label: string;
    description?: string;
    onToggle: () => void;
  }> = ({ checked, label, description, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-start justify-between gap-3 py-2 text-left cursor-pointer group"
    >
      <div className="min-w-0">
        <span className="text-xs font-medium text-[#E6E8EC] block group-hover:text-white">
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
          checked ? 'bg-[#1E5EFF]' : 'bg-[#1C2C50]'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
            checked ? 'left-[18px]' : 'left-0.5 bg-[#8E9BAE]'
          }`}
        />
      </span>
    </button>
  );

  const isPaused = config?.status === 'paused';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl font-bold text-[#E6E8EC] tracking-tight">
            Grupo Monitor
          </h1>
          <p className="text-xs text-[#8E9BAE] mt-1">
            Use um grupo central para distribuir automaticamente suas ofertas
            aos grupos vinculados.
          </p>
        </div>
      </div>

      {/* Empty state */}
      {!config ? (
        <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl py-10 px-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-[#14203B] border border-[#1E3057] flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-[#00C2FF]" />
          </div>
          <h2 className="text-sm font-semibold text-[#E6E8EC]">
            Grupo Monitor não configurado
          </h2>
          <p className="text-xs text-[#8E9BAE] mt-1.5 max-w-sm leading-relaxed">
            Configure seu grupo principal e vincule os grupos que receberão suas
            publicações.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={openCreate}
            leftIcon={<Settings className="w-3.5 h-3.5" />}
            className="mt-5 text-xs font-semibold"
          >
            Configurar Grupo Monitor
          </Button>
        </div>
      ) : (
        <>
          {/* Integration banner */}
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-amber-500/[0.07] border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              <span className="font-semibold text-amber-300">
                Requer integração.
              </span>{' '}
              As mensagens enviadas ao grupo central serão capturadas e
              preparadas para distribuição apenas quando houver integração
              tecnicamente suportada.
            </p>
          </div>

          {/* Grupo Mãe */}
          <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#14203B] border border-[#1E3057] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-[#00C2FF]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-[#8E9BAE] uppercase tracking-wider block">
                    Grupo Mãe
                  </span>
                  <h2 className="text-sm font-bold text-[#E6E8EC] tracking-tight truncate">
                    {config.name}
                  </h2>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    {(() => {
                      const Icon = PLATFORM_ICONS[config.platform];
                      return (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#101B33] border border-[#1C2C50] text-[#C8D1DE]">
                          <Icon className="w-3 h-3" />
                          {config.platform}
                        </span>
                      );
                    })()}
                    {config.identifier && (
                      <span className="text-[10px] font-mono-numeric text-[#64748B]">
                        {config.identifier}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={STATUS_BADGE[config.status]} size="xs">
                  {isPaused ? 'Pausada' : 'Configurada'}
                </Badge>
                <Badge variant="warning" size="xs">
                  Requer integração
                </Badge>
                <Button
                  variant="outline"
                  size="xs"
                  leftIcon={
                    isPaused ? (
                      <Play className="w-3 h-3" />
                    ) : (
                      <Pause className="w-3 h-3" />
                    )
                  }
                  onClick={handleToggleStatus}
                  className="text-xs"
                >
                  {isPaused ? 'Retomar' : 'Pausar'}
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  leftIcon={<Pencil className="w-3 h-3" />}
                  onClick={openEdit}
                  className="text-xs"
                >
                  Editar
                </Button>
              </div>
            </div>
          </div>

          {/* Grupos vinculados */}
          <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-5">
            <div className="flex items-center justify-between gap-3 border-b border-[#162340] pb-3">
              <div>
                <h2 className="text-sm font-semibold text-[#E6E8EC] tracking-tight">
                  Grupos vinculados
                </h2>
                <p className="text-[11px] text-[#8E9BAE] mt-0.5">
                  Tudo que for enviado ao Grupo Monitor será preparado para
                  distribuição aos grupos vinculados.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLinkedModalOpen(true)}
                leftIcon={<Link2 className="w-3.5 h-3.5" />}
                className="text-xs shrink-0"
              >
                Vincular grupos
              </Button>
            </div>

            {/* Visual map */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-stretch gap-3 pt-3">
              <div className="rounded-lg border border-[#1B2947] bg-[#0A1020] p-3 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-semibold text-[#8E9BAE] uppercase tracking-wider">
                  Grupo Mãe
                </span>
                <span className="text-xs font-bold text-[#E6E8EC] mt-0.5 truncate max-w-full">
                  {config.name}
                </span>
              </div>
              <div className="flex sm:flex-col items-center justify-center gap-0.5 text-[#2A3E6D] px-1">
                <ArrowRight className="w-4 h-4 sm:hidden" />
                <ArrowDown className="w-4 h-4 hidden sm:block" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[#475569] text-center">
                  distribui
                </span>
                <span className="text-[9px] text-[#475569] text-center">
                  {linkedChannels.length} destino(s)
                </span>
              </div>
              <div className="rounded-lg border border-[#1B2947] bg-[#0A1020] p-3">
                <span className="text-[10px] font-semibold text-[#8E9BAE] uppercase tracking-wider block text-center sm:text-left">
                  Destinos
                </span>
                {linkedChannels.length === 0 ? (
                  <span className="text-[11px] text-[#64748B] block text-center sm:text-left mt-1">
                    Nenhum grupo vinculado.
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-1.5 justify-center sm:justify-start">
                    {linkedChannels.map((ch) => (
                      <span
                        key={ch.id}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#101B33] border border-[#1C2C50] text-[10px] font-medium text-[#C8D1DE]"
                      >
                        {ch.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Linked list */}
            {linkedChannels.length > 0 && (
              <div className="pt-4 space-y-1.5">
                {linkedChannels.map((ch: DistributionChannel) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[#0A1020] border border-[#162340]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-[#14203B] border border-[#1E3057] flex items-center justify-center shrink-0">
                        {ch.platform === 'WhatsApp' ? (
                          <MessageSquare className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Send className="w-3 h-3 text-[#38BDF8]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-[#E6E8EC] block truncate">
                          {ch.name}
                        </span>
                        <span className="text-[10px] text-[#64748B] block truncate">
                          {ch.platform} · {ch.identifier}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => unlinkChannel(ch.id)}
                      title="Desvincular grupo"
                      className="w-7 h-7 rounded-md flex items-center justify-center text-[#8E9BAE] hover:bg-red-500/10 hover:text-red-400 transition-colors shrink-0 cursor-pointer"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Regras de distribuição */}
          <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#162340]">
              <Repeat className="w-4 h-4 text-[#00C2FF]" />
              <h2 className="text-sm font-semibold text-[#E6E8EC] tracking-tight">
                Regras de distribuição
              </h2>
            </div>

            <div className="pt-4 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-[#E6E8EC]">
                    Distribuir para
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {(
                      [
                        {
                          value: 'all',
                          label: 'Todos os grupos vinculados',
                          desc: 'Cada publicação vai para todos os destinos.',
                        },
                        {
                          value: 'selected',
                          label: 'Grupos selecionados manualmente',
                          desc: 'Somente os destinos escolhidos recebem.',
                        },
                      ] as {
                        value: MonitorDistributionTarget;
                        label: string;
                        desc: string;
                      }[]
                    ).map((opt) => {
                      const active = config.rules.target === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateRules({ target: opt.value })}
                          className={`px-3 py-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#121E38] border-[#1E325C]'
                              : 'bg-[#070C18] border-[#162340] hover:border-[#1E3360]'
                          }`}
                        >
                          <span
                            className={`text-[11px] font-medium block ${
                              active ? 'text-[#E6E8EC]' : 'text-[#94A3B8]'
                            }`}
                          >
                            {opt.label}
                          </span>
                          <span className="text-[10px] text-[#64748B] mt-0.5 block leading-relaxed">
                            {opt.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {config.rules.target === 'selected' && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {linkedChannels.length === 0 ? (
                        <span className="text-[10px] text-[#64748B]">
                          Vincule grupos para poder selecioná-los manualmente.
                        </span>
                      ) : (
                        linkedChannels.map((ch) => {
                          const selected = config.rules.selectedGroupIds.includes(
                            ch.id
                          );
                          return (
                            <button
                              key={ch.id}
                              type="button"
                              onClick={() => toggleSelected(ch.id)}
                              className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                                selected
                                  ? 'bg-[#1E5EFF]/15 text-[#00C2FF] border-[#1E5EFF]/40'
                                  : 'bg-[#070C18] text-[#94A3B8] border-[#1C2C50] hover:border-[#2A4072]'
                              }`}
                            >
                              {ch.name}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#E6E8EC] font-medium">
                      Intervalo entre grupos (min)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={config.rules.intervalMinutes}
                      onChange={(e) =>
                        updateRules({
                          intervalMinutes:
                            parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full h-8 px-3 bg-[#070C18] border border-[#182747] rounded-lg text-xs text-[#E6E8EC] focus:outline-none focus:border-[#1E5EFF]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#E6E8EC] font-medium">
                      Ordem
                    </label>
                    <Select
                      options={[
                        { value: 'sequential', label: 'Sequencial' },
                        { value: 'random', label: 'Aleatória' },
                      ]}
                      value={config.rules.order}
                      onChange={(e) =>
                        updateRules({ order: e.target.value as MonitorOrder })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="divide-y divide-[#101B33]">
                <ToggleRow
                  checked={config.rules.respectBusinessHours}
                  label="Respeitar horário de funcionamento"
                  description="Limitam-se os envios à janela de horário permitida."
                  onToggle={() =>
                    updateRules({
                      respectBusinessHours: !config.rules.respectBusinessHours,
                    })
                  }
                />
                <ToggleRow
                  checked={config.rules.checkDuplicates}
                  label="Verificar duplicidade"
                  description="Compara publicações com itens já processados."
                  onToggle={() =>
                    updateRules({
                      checkDuplicates: !config.rules.checkDuplicates,
                    })
                  }
                />
                <ToggleRow
                  checked={config.rules.avoidRepeatedPublish}
                  label="Evitar publicação repetida"
                  description="Não reenvia o mesmo conteúdo para o mesmo destino."
                  onToggle={() =>
                    updateRules({
                      avoidRepeatedPublish: !config.rules.avoidRepeatedPublish,
                    })
                  }
                />
                <ToggleRow
                  checked={config.rules.useCentralQueue}
                  label="Utilizar fila central"
                  description="Publicações passam pela fila antes de cada destino."
                  onToggle={() =>
                    updateRules({
                      useCentralQueue: !config.rules.useCentralQueue,
                    })
                  }
                />
              </div>
            </div>

            <p className="text-[10px] text-[#64748B] pt-3 mt-2 border-t border-[#162340] leading-relaxed">
              Arquitetura: Grupo Mãe → Publicação → Fila Central → Grupo 1 →
              intervalo → Grupo 2 → intervalo → Grupo 3... Nada é enviado
              simultaneamente — o motor de encadeamento será ativado com a
              integração.
            </p>
          </div>

          {/* Processamento */}
          <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#162340]">
              <ListChecks className="w-4 h-4 text-[#00C2FF]" />
              <h2 className="text-sm font-semibold text-[#E6E8EC] tracking-tight">
                Processamento
              </h2>
            </div>
            <div className="pt-2 divide-y divide-[#101B33]">
              {PROCESSING_STEPS.map((step) => (
                <ToggleRow
                  key={step.key}
                  checked={config.processing[step.key]}
                  label={step.label}
                  onToggle={() => updateProcessing(step.key)}
                />
              ))}
            </div>
            <p className="text-[10px] text-[#64748B] pt-3 mt-2 border-t border-[#162340] leading-relaxed">
              Configuração local apenas — nenhuma dessas etapas é executada nesta
              versão.
            </p>
          </div>

          {/* Atividade */}
          <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#162340]">
              <Inbox className="w-4 h-4 text-[#00C2FF]" />
              <h2 className="text-sm font-semibold text-[#E6E8EC] tracking-tight">
                Atividade
              </h2>
            </div>
            <div className="py-8 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#101B33] border border-[#1C2C50] flex items-center justify-center mb-2">
                <Inbox className="w-4 h-4 text-[#64748B]" />
              </div>
              <span className="text-xs font-semibold text-[#8E9BAE]">
                Nenhuma publicação recebida.
              </span>
              <p className="text-[10px] text-[#64748B] mt-1 max-w-[280px] leading-relaxed">
                As mensagens enviadas ao grupo central serão registradas aqui
                quando houver integração configurada.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Form Modal */}
      <MonitorGroupFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
        onSave={handleSaveConfig}
      />

      {/* Linked Groups Modal */}
      <LinkedGroupsModal
        isOpen={linkedModalOpen}
        onClose={() => setLinkedModalOpen(false)}
        channels={channels}
        linkedIds={config?.linkedGroupIds ?? []}
        onSave={handleSaveLinks}
      />

      {/* Toasts */}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-[#1E325C] bg-[#0E1628] shadow-lg shadow-black/30 animate-in slide-in-from-bottom-3 fade-in"
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-[#00C2FF] shrink-0" />
            )}
            <span className="text-xs text-[#E6E8EC]">{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};