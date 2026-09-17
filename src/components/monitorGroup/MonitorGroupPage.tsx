import React, { useMemo, useState, useEffect } from 'react';
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
  Activity,
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
import { Badge, BadgeProps } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { getGroupDisplayName, DOMNEX_DEFAULT_SESSION_ID } from '../../types/whatsApp';
import {
  replaceChildGroups,
  removeChildGroup,
  setMonitorEnabled,
  useWhatsAppGroupConfig,
} from '../../services/whatsApp/groupConfigStore';
import {
  MonitorGroupFormModal,
  MonitorGroupDraft,
} from './MonitorGroupFormModal';
import { LinkedGroupsModal } from './LinkedGroupsModal';
import {
  getMonitorStatus,
  MonitorServerStatus,
} from '../../services/whatsApp/monitorService';
import { resolveMonitorUiState } from './monitorUiState';
import { useWhatsAppAccounts } from '../../services/whatsApp/useWhatsAppAccounts';

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

function formatTimestamp(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export const MonitorGroupPage: React.FC = () => {
  const [config, setConfig] = useState<MonitorGroupConfig | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<
    { name: string; platform: MonitorGroupConfig['platform']; identifier: string } | null
  >(null);
  const [linkedModalOpen, setLinkedModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [monitor, setMonitor] = useState<MonitorServerStatus | null>(null);
  const [monitorReachable, setMonitorReachable] = useState<boolean | null>(
    null
  );

  const { groups, parentGroupId, childGroupIds } = useWhatsAppGroupConfig();
  const parentGroup = groups.find((g) => g.id === parentGroupId) ?? null;
  const monitorSessionId =
    parentGroup?.sessionId ?? DOMNEX_DEFAULT_SESSION_ID;
  const { accounts } = useWhatsAppAccounts();
  const accountDisplayNameBySession = useMemo(() => {
    const map = new Map<string, string>();
    for (const acc of accounts) {
      map.set(acc.sessionId, acc.displayName || acc.name || 'WhatsApp');
    }
    return map;
  }, [accounts]);
  const sessionDisplayName = parentGroup?.sessionId
    ? (accountDisplayNameBySession.get(parentGroup.sessionId) ?? 'WhatsApp')
    : null;

  // Indicadores reais do monitor no backend (polling leve, dados honestos).
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const next = await getMonitorStatus(monitorSessionId);
        if (cancelled) return;
        setMonitor(next);
        setMonitorReachable(true);
      } catch {
        if (cancelled) return;
        setMonitorReachable(false);
      }
    };
    void load();
    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [monitorSessionId]);

  // Grupo Monitor consome os grupos reais sincronizados na aba WhatsApp.
  // Quando um Grupo Mãe é definido lá, a configuração é derivada automaticamente.
  useEffect(() => {
    if (!parentGroup) return;
    setConfig((prev) => {
      const base: MonitorGroupConfig =
        prev ?? {
          id: `MONITOR-${Date.now().toString(36).toUpperCase()}`,
          name: getGroupDisplayName(parentGroup),
          platform: 'WhatsApp',
          identifier: parentGroup.id,
          status: 'configured',
          linkedGroupIds: [],
          rules: { ...DEFAULT_RULES },
          processing: { ...DEFAULT_PROCESSING },
          createdAt: new Date().toLocaleDateString('pt-BR'),
          automationSource: 'MONITOR_GROUP',
        };
      return {
        ...base,
        name: getGroupDisplayName(parentGroup),
        platform: 'WhatsApp',
        identifier: parentGroup.id,
        linkedGroupIds: childGroupIds,
      };
    });
  }, [parentGroup, childGroupIds]);

  const linkedGroups = groups.filter((g) => childGroupIds.includes(g.id));
  const linkedChannels: {
    id: string;
    name: string;
    platform: 'WhatsApp';
    identifier: string;
  }[] = linkedGroups.map((g) => ({
    id: g.id,
    name: getGroupDisplayName(g),
    platform: 'WhatsApp',
    identifier: g.id,
  }));

  const linkedGroupItems = groups.map((g) => ({
    id: g.id,
    name: getGroupDisplayName(g),
    subtitle: `WhatsApp · ${g.id}`,
  }));

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

  const handleToggleStatus = async () => {
    if (!config) return;
    if (monitorReachable !== true) {
      showToast(
        'Servidor de conexão indisponível — tente novamente mais tarde.',
        'info'
      );
      return;
    }
    const targetEnabled = isPaused;
    if (
      targetEnabled &&
      !(parentGroup && childGroupIds.length > 0)
    ) {
      showToast(
        'Defina o Grupo Mãe e pelo menos um destino para retomar o monitor.',
        'info'
      );
      return;
    }
    try {
      const updated = await setMonitorEnabled(targetEnabled);
      setMonitor(updated);
      setMonitorReachable(true);
      setConfig((prev) =>
        prev
          ? { ...prev, status: targetEnabled ? 'configured' : 'paused' }
          : prev
      );
      showToast(
        targetEnabled
          ? 'Grupo Monitor retomado.'
          : 'Grupo Monitor pausado.',
        'info'
      );
    } catch {
      showToast('Não foi possível alterar o estado do monitor.', 'info');
    }
  };

  const handleSaveLinks = (ids: string[]) => {
    replaceChildGroups(ids);
    setConfig((prev) => (prev ? { ...prev, linkedGroupIds: ids } : prev));
    showToast(
      ids.length > 0
        ? `${ids.length} grupo(s) vinculado(s) como destino.`
        : 'Nenhum grupo vinculado.',
      'info'
    );
  };

  const unlinkChannel = (id: string) => {
    removeChildGroup(id);
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
        <span className="text-xs font-medium text-[#172033] block group-hover:text-[#2563EB]">
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

  const { isPaused, active: monitorActive } = resolveMonitorUiState(
    monitor,
    monitorReachable,
    config?.status === 'paused'
  );
  const statusForBadge: MonitorGroupStatus = isPaused ? 'paused' : 'configured';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl font-bold text-[#172033] tracking-tight">
            Grupo Monitor
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Use um grupo central para distribuir automaticamente suas ofertas
            aos grupos vinculados.
          </p>
        </div>
      </div>

      {/* Empty state */}
      {!config ? (
        <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl py-10 px-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-[#E2E8F0] border border-[#BFDBFE] flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-[#2563EB]" />
          </div>
          <h2 className="text-sm font-semibold text-[#172033]">
            Grupo Monitor não configurado
          </h2>
<p className="text-xs text-[#64748B] mt-1.5 max-w-sm leading-relaxed">
              Sincronize seus grupos na aba WhatsApp, defina o Grupo Mãe e
              vincule os destinos que receberão suas publicações.
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
          {/* Integration banner: exibido apenas quando o backend não responde.
              Com backend acessível o monitor é suportado e o banner é removido. */}
          {monitorReachable === false && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-amber-500/[0.07] border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700/90 leading-relaxed">
                <span className="font-semibold text-amber-700">
                  Requer integração.
                </span>{' '}
                As mensagens enviadas ao grupo central serão capturadas e
                preparadas para distribuição apenas quando houver integração
                tecnicamente suportada.
              </p>
            </div>
          )}

          {/* Monitor real (backend) */}
          <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#2563EB]" />
                <h2 className="text-sm font-semibold text-[#172033] tracking-tight">
                  Monitor
                </h2>
                {parentGroup?.sessionId && sessionDisplayName && (
                  <span className="text-[10px] text-[#64748B] font-mono-numeric">
                    · {sessionDisplayName}
                  </span>
                )}
              </div>
              <Badge
                size="xs"
                variant={monitorActive ? 'success' : 'neutral'}
              >
                {monitorReachable === false
                  ? 'Backend indisponível'
                  : monitorActive
                  ? 'Ativo'
                  : 'Inativo'}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs">
              <div className="rounded-lg border border-[#DCE3EC] bg-[#F8FAFC] px-3 py-2.5">
                <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                  Última mensagem recebida
                </span>
                <span className="text-sm text-[#172033] mt-0.5 block font-mono-numeric">
                  {monitorReachable === false
                    ? '—'
                    : formatTimestamp(monitor?.lastMessageAt ?? null)}
                </span>
              </div>
              <div className="rounded-lg border border-[#DCE3EC] bg-[#F8FAFC] px-3 py-2.5">
                <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                  Último envio
                </span>
                <span className="text-sm text-[#172033] mt-0.5 block font-mono-numeric">
                  {monitorReachable === false
                    ? '—'
                    : formatTimestamp(monitor?.lastSendAt ?? null)}
                </span>
              </div>
            </div>
            {monitorReachable === false ? (
              <p className="text-[10px] text-amber-700/80 pt-2">
                Servidor de conexão offline — indicadores indisponíveis.
              </p>
            ) : monitor?.lastError ? (
              <p className="text-[10px] text-red-700/90 pt-2">
                Último erro: {monitor.lastError}
              </p>
            ) : (
              <p className="text-[10px] text-[#64748B] pt-2">
                Replicação de texto para mensagens novas no grupo mãe — nenhum
                histórico é reprocessado.
              </p>
            )}
          </div>

          {/* Grupo Mãe */}
          <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#E2E8F0] border border-[#BFDBFE] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                    Grupo Mãe
                  </span>
                  <h2 className="text-sm font-bold text-[#172033] tracking-tight truncate">
                    {config.name}
                  </h2>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    {(() => {
                      const Icon = PLATFORM_ICONS[config.platform];
                      return (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F1F5F9] border border-[#CBD5E1] text-[#334155]">
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
                {parentGroup && (
                  <Badge variant="info" size="xs">
                    Sincronizado do WhatsApp
                  </Badge>
                )}
                {parentGroup?.sessionId && sessionDisplayName && (
                  <Badge variant="neutral" size="xs">
                    Conta · {sessionDisplayName}
                  </Badge>
                )}
                <Badge variant={STATUS_BADGE[statusForBadge]} size="xs">
                  {isPaused ? 'Pausada' : 'Configurada'}
                </Badge>
                {monitorReachable === false && (
                  <Badge variant="warning" size="xs">
                    Requer integração
                  </Badge>
                )}
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
          <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-5">
            <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
              <div>
                <h2 className="text-sm font-semibold text-[#172033] tracking-tight">
                  Grupos vinculados
                </h2>
                <p className="text-[11px] text-[#64748B] mt-0.5">
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
              <div className="rounded-lg border border-[#DCE3EC] bg-[#F8FAFC] p-3 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Grupo Mãe
                </span>
                <span className="text-xs font-bold text-[#172033] mt-0.5 truncate max-w-full">
                  {config.name}
                </span>
                {parentGroup?.sessionId && sessionDisplayName && (
                  <span className="text-[9px] text-[#64748B] font-mono-numeric mt-0.5">
                    {sessionDisplayName}
                  </span>
                )}
              </div>
              <div className="flex sm:flex-col items-center justify-center gap-0.5 text-[#93C5FD] px-1">
                <ArrowRight className="w-4 h-4 sm:hidden" />
                <ArrowDown className="w-4 h-4 hidden sm:block" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[#475569] text-center">
                  distribui
                </span>
                <span className="text-[9px] text-[#475569] text-center">
                  {linkedChannels.length} destino(s)
                </span>
              </div>
              <div className="rounded-lg border border-[#DCE3EC] bg-[#F8FAFC] p-3">
                <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block text-center sm:text-left">
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
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#F1F5F9] border border-[#CBD5E1] text-[10px] font-medium text-[#334155]"
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
                {linkedChannels.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-[#E2E8F0] border border-[#BFDBFE] flex items-center justify-center shrink-0">
                        {ch.platform === 'WhatsApp' ? (
                          <MessageSquare className="w-3 h-3 text-emerald-700" />
                        ) : (
                          <Send className="w-3 h-3 text-[#3B82F6]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-[#172033] block truncate">
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
                      className="w-7 h-7 rounded-md flex items-center justify-center text-[#64748B] hover:bg-red-500/10 hover:text-red-700 transition-colors shrink-0 cursor-pointer"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Regras de distribuição */}
          <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
              <Repeat className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-sm font-semibold text-[#172033] tracking-tight">
                Regras de distribuição
              </h2>
            </div>

            <div className="pt-4 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-[#172033]">
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
                              ? 'bg-[#EFF6FF] border-[#BFDBFE]'
                              : 'bg-[#FFFFFF] border-[#E2E8F0] hover:border-[#BFDBFE]'
                          }`}
                        >
                          <span
                            className={`text-[11px] font-medium block ${
                              active ? 'text-[#172033]' : 'text-[#94A3B8]'
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
                                  ? 'bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]/40'
                                  : 'bg-[#FFFFFF] text-[#94A3B8] border-[#CBD5E1] hover:border-[#93C5FD]'
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
                    <label className="text-xs text-[#172033] font-medium">
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
                      className="w-full h-8 px-3 bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#172033] font-medium">
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

              <div className="divide-y divide-[#F1F5F9]">
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

            <p className="text-[10px] text-[#64748B] pt-3 mt-2 border-t border-[#E2E8F0] leading-relaxed">
              Arquitetura: Grupo Mãe → Publicação → Fila Central → Grupo 1 →
              intervalo → Grupo 2 → intervalo → Grupo 3... Nada é enviado
              simultaneamente — o motor de encadeamento será ativado com a
              integração.
            </p>
          </div>

          {/* Processamento */}
          <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
              <ListChecks className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-sm font-semibold text-[#172033] tracking-tight">
                Processamento
              </h2>
            </div>
            <div className="pt-2 divide-y divide-[#F1F5F9]">
              {PROCESSING_STEPS.map((step) => (
                <ToggleRow
                  key={step.key}
                  checked={config.processing[step.key]}
                  label={step.label}
                  onToggle={() => updateProcessing(step.key)}
                />
              ))}
            </div>
            <p className="text-[10px] text-[#64748B] pt-3 mt-2 border-t border-[#E2E8F0] leading-relaxed">
              Configuração local apenas — nenhuma dessas etapas é executada nesta
              versão.
            </p>
          </div>

          {/* Atividade */}
          <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
              <Inbox className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-sm font-semibold text-[#172033] tracking-tight">
                Atividade
              </h2>
            </div>
            <div className="py-8 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center mb-2">
                <Inbox className="w-4 h-4 text-[#64748B]" />
              </div>
              <span className="text-xs font-semibold text-[#64748B]">
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
        items={linkedGroupItems}
        linkedIds={config?.linkedGroupIds ?? childGroupIds}
        onSave={handleSaveLinks}
      />

      {/* Toasts */}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-[#BFDBFE] bg-[#FFFFFF] shadow-lg shadow-black/30 animate-in slide-in-from-bottom-3 fade-in"
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
            )}
            <span className="text-xs text-[#172033]">{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};