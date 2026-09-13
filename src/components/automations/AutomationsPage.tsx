import React, { useEffect, useState } from 'react';
import {
  Radar,
  ListChecks,
  RefreshCw,
  Share2,
  ArrowRight,
  ArrowDown,
  Activity,
  ShieldAlert,
  GitCompareArrows,
  Sparkles,
} from 'lucide-react';
import { Automation, AutomationActivityItem } from '../../types';
import {
  initialAutomations,
  automationActivityMock,
  duplicateConflictsMock,
} from '../../data/mockAutomations';
import {
  AutoSearchAutomation,
  AutoSearchSendRecord,
  getCurrentTenantId,
  listAutoSearchAutomations,
  listAutoSearchSends,
} from '../../services/affiliatePrograms/affiliateProgramsService';
import { AutomationCard } from './AutomationCard';
import { AutomationConfigureDrawer } from './AutomationConfigureDrawer';
import { Button } from '../ui/Button';

function formatRealDate(value: string | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR');
}

function realAutoSearchToAutomation(
  automation: AutoSearchAutomation,
  sends: AutoSearchSendRecord[]
): Automation {
  const automationSends = sends.filter((send) => send.automationId === automation.id);
  const todayKey = new Date().toLocaleDateString('pt-BR');
  const sentToday = automationSends.filter(
    (send) => new Date(send.sentAt).toLocaleDateString('pt-BR') === todayKey
  ).length;
  const lastSend = automationSends
    .slice()
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0];
  const hasDestination =
    Boolean(automation.destination.accountId) && automation.destination.groupIds.length > 0;

  return {
    id: automation.id,
    type: 'AUTO_SEARCH',
    name: automation.name,
    description: `Busca real Shopee · ${automation.destination.groupIds.length} destino(s) · intervalo ${automation.schedule.intervalMinutes} min`,
    status: !hasDestination ? 'REQUIRES_CONFIGURATION' : automation.active ? 'ACTIVE' : 'PAUSED',
    marketplaces: ['Shopee'],
    metrics: {
      entriesToday: sentToday,
      processed: automationSends.length,
      queued: 0,
      published: automationSends.length,
      invalid: 0,
      duplicates: 0,
      pending: 0,
      lastRun: formatRealDate(lastSend?.sentAt),
    },
    sources: automation.destination.groupIds.map((groupId) => ({
      id: `${automation.destination.accountId}|${groupId}`,
      name: groupId,
      type: 'AUTO_SEARCH',
      description: `Destino WhatsApp da conta ${automation.destination.accountId}`,
      active: automation.active,
    })),
    capabilities: {
      detectNewEntries: 'AVAILABLE',
      identifyProductAndLink: 'AVAILABLE',
      generateAffiliateLink: 'AVAILABLE',
      replaceAffiliateLink: 'AVAILABLE',
      routeToChannels: hasDestination ? 'AVAILABLE' : 'REQUIRES_CONFIGURATION',
      sendMessages: hasDestination ? 'AVAILABLE' : 'REQUIRES_CONFIGURATION',
    },
    requiresIntegration: !hasDestination,
    integrationHint: hasDestination ? undefined : 'Defina uma conta e ao menos um grupo de destino.',
  };
}

export const AutomationsPage: React.FC<{
  onNavigate?: (item: string) => void;
}> = ({ onNavigate }) => {
  const [automations, setAutomations] = useState<Automation[]>(() =>
    initialAutomations.filter((automation) => automation.type !== 'AUTO_SEARCH')
  );
  const [isLoadingRealAutomations, setIsLoadingRealAutomations] = useState(true);
  const [realAutomationsError, setRealAutomationsError] = useState<string | null>(null);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(
    null
  );
  const [duplicates, setDuplicates] = useState(duplicateConflictsMock);

  const [toast, setToast] = useState<{
    text: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  const activeCount = automations.filter((a) => a.status === 'ACTIVE').length;


  useEffect(() => {
    let active = true;
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      setRealAutomationsError('Tenant de desenvolvimento não configurado para carregar automações reais.');
      setIsLoadingRealAutomations(false);
      return () => {
        active = false;
      };
    }

    Promise.all([listAutoSearchAutomations(tenantId), listAutoSearchSends(tenantId)])
      .then(([realAutoSearch, sends]) => {
        if (!active) return;
        const realCards = realAutoSearch.map((automation) =>
          realAutoSearchToAutomation(automation, sends)
        );
        const otherModules = initialAutomations.filter(
          (automation) => automation.type !== 'AUTO_SEARCH'
        );
        setAutomations([...realCards, ...otherModules]);
        setRealAutomationsError(null);
      })
      .catch((error) => {
        if (!active) return;
        setRealAutomationsError(
          error instanceof Error ? error.message : 'Falha ao carregar automações reais.'
        );
      })
      .finally(() => {
        if (active) setIsLoadingRealAutomations(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleConfigure = (auto: Automation) => {
    if (auto.type === 'AUTO_SEARCH' && onNavigate) {
      onNavigate('Busca Automática');
      return;
    }
    if (auto.type === 'LINK_LIST' && onNavigate) {
      onNavigate('Lista de Links');
      return;
    }
    if (auto.type === 'MIRROR' && onNavigate) {
      onNavigate('Espelhamento');
      return;
    }
    if (auto.type === 'MONITOR_GROUP' && onNavigate) {
      onNavigate('Grupo Monitor');
      return;
    }
    setSelectedAutomation(auto);
  };

  const handleResolveDuplicate = (id: string, action: string) => {
    setDuplicates((prev) => prev.filter((d) => d.id !== id));
    setToast({
      text:
        action === 'keep-best'
          ? 'Melhor oferta mantida. Entrada duplicada descartada.'
          : action === 'keep-both'
          ? 'Ambas as entradas mantidas na operação.'
          : 'Nova entrada ignorada. Oferta original preservada.',
      type: 'info',
    });
  };

  const handleSaveAutomation = (updated: Automation) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
    setToast({
      text:
        updated.status === 'ACTIVE'
          ? `${updated.name} reativada e configurações salvas.`
          : `${updated.name} pausada. Configurações salvas.`,
      type: 'success',
    });
  };

  const flowSources = [
    { label: 'Busca Automática', icon: Radar, color: 'text-[#2563EB]' },
    { label: 'Lista de Links', icon: ListChecks, color: 'text-[#3B82F6]' },
    { label: 'Espelhamento', icon: RefreshCw, color: 'text-[#A78BFA]' },
    { label: 'Grupo Monitor', icon: Share2, color: 'text-emerald-700' },
  ];

  const activityToneStyles: Record<
    AutomationActivityItem['tone'],
    string
  > = {
    success: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25',
    info: 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/25',
    warning: 'bg-amber-500/10 text-amber-700 border-amber-500/25',
    danger: 'bg-red-500/10 text-red-700 border-red-500/25',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#172033] tracking-tight">
              Automações
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-semibold text-[#2563EB]">
              <Activity className="w-3 h-3 text-[#2563EB]" />
              <span>
                {activeCount} de {automations.length} ativas
              </span>
            </div>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Escolha como suas ofertas entram e são distribuídas.
          </p>
          {isLoadingRealAutomations && (
            <p className="text-[11px] text-[#64748B] mt-1">Sincronizando automações reais...</p>
          )}
          {realAutomationsError && (
            <p className="text-[11px] text-amber-700 mt-1">{realAutomationsError}</p>
          )}
        </div>
      </div>

      {/* Automation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {automations.map((a) => (
          <AutomationCard
            key={a.id}
            automation={a}
            onConfigure={handleConfigure}
          />
        ))}
      </div>

      {/* Fluxo da Operação */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[#172033] tracking-tight">
              Fluxo da operação
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Todas as entradas convergem para o mesmo núcleo operacional.
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-stretch gap-3">
          {/* Entradas */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {flowSources.map((source) => {
              const Icon = source.icon;
              return (
                <div
                  key={source.label}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#E2E8F0] border border-[#BFDBFE] flex items-center justify-center shrink-0">
                    <Icon className={`w-4 h-4 ${source.color}`} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-[#172033] block">
                      {source.label}
                    </span>
                    <span className="text-[10px] text-[#64748B]">Entrada</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connector arrow */}
          <div className="flex items-center justify-center lg:flex-col gap-1 px-2">
            <ArrowRight className="w-4 h-4 text-[#334155] hidden lg:block" />
            <ArrowDown className="w-4 h-4 text-[#334155] lg:hidden" />
          </div>

          {/* Pipeline stages */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
            {[
              { label: 'Processamento', desc: 'Normalização e validação' },
              { label: 'Fila', desc: 'Programação da publicação' },
              { label: 'Distribuição', desc: 'Canais e grupos' },
            ].map((stage) => (
              <div
                key={stage.label}
                className="flex flex-col justify-center px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1]"
              >
                <span className="text-xs font-semibold text-[#2563EB]">
                  {stage.label}
                </span>
                <span className="text-[10px] text-[#64748B] mt-0.5">
                  {stage.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Duplicidade & Atividade Recente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Deduplicação */}
        <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#172033] tracking-tight">
                Proteção contra duplicidade
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Conflitos detectados entre diferentes origens.
              </p>
            </div>
            {duplicates.length > 0 && (
              <span className="text-xs font-mono-numeric font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30 px-2 py-0.5 rounded">
                {duplicates.length} pendente{duplicates.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {duplicates.length === 0 ? (
            <div className="py-8 text-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
              <ShieldAlert className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
              <p className="text-xs text-[#64748B]">
                Nenhum conflito de duplicidade pendente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {duplicates.map((d) => (
                <div
                  key={d.id}
                  className="p-4 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#172033] leading-snug">
                        <span className="flex items-center gap-1.5 text-amber-700 mb-1">
                          <GitCompareArrows className="w-3.5 h-3.5 shrink-0" />
                          Possível duplicidade detectada
                        </span>
                        {d.productName}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] mt-1.5 space-y-1">
                        <span className="block">
                          Já presente através de{' '}
                          <span className="font-semibold text-[#172033]">
                            {d.existingSource === 'AUTO_SEARCH'
                              ? 'Busca Automática'
                              : d.existingSource === 'LINK_LIST'
                              ? 'Lista de Links'
                              : d.existingSource === 'MIRROR'
                              ? 'Espelhamento'
                              : 'Grupo Monitor'}
                          </span>{' '}
                          · R$ {d.existingPrice.toFixed(2)} · Score {d.existingScore}
                        </span>
                        <span className="block">
                          Nova entrada:{' '}
                          <span className="font-semibold text-[#172033]">
                            {d.newSource === 'AUTO_SEARCH'
                              ? 'Busca Automática'
                              : d.newSource === 'LINK_LIST'
                              ? 'Lista de Links'
                              : d.newSource === 'MIRROR'
                              ? 'Espelhamento'
                              : 'Grupo Monitor'}
                          </span>{' '}
                          · R$ {d.newPrice.toFixed(2)} · Score {d.newScore}
                        </span>
                      </p>
                    </div>
                    <span className="text-[10px] text-[#64748B] font-mono-numeric shrink-0">
                      {d.detectedAt}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleResolveDuplicate(d.id, 'keep-best')}
                      className="text-xs border-[#DCE3EC] text-[#172033]"
                    >
                      Manter melhor oferta
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleResolveDuplicate(d.id, 'keep-both')}
                      className="px-2.5 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-[#172033] hover:bg-[#E2E8F0] border border-[#DCE3EC] transition-colors"
                    >
                      Manter ambas
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolveDuplicate(d.id, 'ignore-new')}
                      className="px-2.5 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-rose-700 hover:bg-rose-500/10 border border-[#DCE3EC] transition-colors"
                    >
                      Ignorar nova
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Atividade Recente */}
        <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#172033] tracking-tight">
                Atividade recente
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Últimos eventos registrados pelas automações.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {automationActivityMock.length === 0 ? (
              <div className="py-8 text-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                <Activity className="w-8 h-8 text-[#475569] mx-auto mb-2" />
                <p className="text-xs text-[#64748B]">
                  Nenhuma atividade registrada ainda.
                </p>
              </div>
            ) : (
              automationActivityMock.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
                >
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono-numeric font-semibold shrink-0 mt-0.5 ${activityToneStyles[a.tone]}`}
                  >
                    {a.time}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-[#172033] leading-snug">
                      {a.title}
                    </p>
                    <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                      {a.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Configure Drawer */}
      <AutomationConfigureDrawer
        automation={selectedAutomation}
        isOpen={!!selectedAutomation}
        onClose={() => setSelectedAutomation(null)}
        onSave={handleSaveAutomation}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#FFFFFF] border border-[#BFDBFE] text-[#172033] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toast.type === 'warning' ? (
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          ) : toast.type === 'info' ? (
            <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
          )}
          <span className="font-medium leading-relaxed">{toast.text}</span>
        </div>
      )}
    </div>
  );
};