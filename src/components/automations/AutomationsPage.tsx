import React, { useState } from 'react';
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
import { AutomationCard } from './AutomationCard';
import { AutomationConfigureDrawer } from './AutomationConfigureDrawer';
import { Button } from '../ui/Button';

export const AutomationsPage: React.FC<{
  onNavigate?: (item: string) => void;
}> = ({ onNavigate }) => {
  const [automations, setAutomations] = useState<Automation[]>(
    initialAutomations
  );
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(
    null
  );
  const [duplicates, setDuplicates] = useState(duplicateConflictsMock);

  const [toast, setToast] = useState<{
    text: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  const activeCount = automations.filter((a) => a.status === 'ACTIVE').length;

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
    { label: 'Busca Automática', icon: Radar, color: 'text-[#00C2FF]' },
    { label: 'Lista de Links', icon: ListChecks, color: 'text-[#38BDF8]' },
    { label: 'Espelhamento', icon: RefreshCw, color: 'text-[#A78BFA]' },
    { label: 'Grupo Monitor', icon: Share2, color: 'text-emerald-400' },
  ];

  const activityToneStyles: Record<
    AutomationActivityItem['tone'],
    string
  > = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    info: 'bg-[#1E5EFF]/10 text-[#00C2FF] border-[#1E5EFF]/25',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    danger: 'bg-red-500/10 text-red-400 border-red-500/25',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#E6E8EC] tracking-tight">
              Automações
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#101F3D] border border-[#1C3A6E] text-xs font-semibold text-[#00C2FF]">
              <Activity className="w-3 h-3 text-[#00C2FF]" />
              <span>
                {activeCount} de {automations.length} ativas
              </span>
            </div>
          </div>
          <p className="text-xs text-[#8E9BAE] mt-1">
            Escolha como suas ofertas entram e são distribuídas.
          </p>
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
      <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[#E6E8EC] tracking-tight">
              Fluxo da operação
            </h3>
            <p className="text-xs text-[#8E9BAE] mt-0.5">
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
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0A1020] border border-[#162340]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#14203B] border border-[#1E3057] flex items-center justify-center shrink-0">
                    <Icon className={`w-4 h-4 ${source.color}`} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-[#E6E8EC] block">
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
                className="flex flex-col justify-center px-3 py-2 rounded-lg bg-[#0E1526] border border-[#1C2C50]"
              >
                <span className="text-xs font-semibold text-[#00C2FF]">
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
        <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#E6E8EC] tracking-tight">
                Proteção contra duplicidade
              </h3>
              <p className="text-xs text-[#8E9BAE] mt-0.5">
                Conflitos detectados entre diferentes origens.
              </p>
            </div>
            {duplicates.length > 0 && (
              <span className="text-xs font-mono-numeric font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                {duplicates.length} pendente{duplicates.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {duplicates.length === 0 ? (
            <div className="py-8 text-center bg-[#0A1020] border border-[#162340] rounded-xl">
              <ShieldAlert className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-[#8E9BAE]">
                Nenhum conflito de duplicidade pendente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {duplicates.map((d) => (
                <div
                  key={d.id}
                  className="p-4 bg-[#0B1324] border border-[#162340] rounded-xl space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#E6E8EC] leading-snug">
                        <span className="flex items-center gap-1.5 text-amber-400 mb-1">
                          <GitCompareArrows className="w-3.5 h-3.5 shrink-0" />
                          Possível duplicidade detectada
                        </span>
                        {d.productName}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] mt-1.5 space-y-1">
                        <span className="block">
                          Já presente através de{' '}
                          <span className="font-semibold text-[#E6E8EC]">
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
                          <span className="font-semibold text-[#E6E8EC]">
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
                      className="text-xs border-[#182747] text-[#E6E8EC]"
                    >
                      Manter melhor oferta
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleResolveDuplicate(d.id, 'keep-both')}
                      className="px-2.5 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-[#E6E8EC] hover:bg-[#14203B] border border-[#182747] transition-colors"
                    >
                      Manter ambas
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolveDuplicate(d.id, 'ignore-new')}
                      className="px-2.5 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-rose-400 hover:bg-rose-500/10 border border-[#182747] transition-colors"
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
        <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#E6E8EC] tracking-tight">
                Atividade recente
              </h3>
              <p className="text-xs text-[#8E9BAE] mt-0.5">
                Últimos eventos registrados pelas automações.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {automationActivityMock.length === 0 ? (
              <div className="py-8 text-center bg-[#0A1020] border border-[#162340] rounded-xl">
                <Activity className="w-8 h-8 text-[#475569] mx-auto mb-2" />
                <p className="text-xs text-[#8E9BAE]">
                  Nenhuma atividade registrada ainda.
                </p>
              </div>
            ) : (
              automationActivityMock.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-[#0A1020] border border-[#162340]"
                >
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono-numeric font-semibold shrink-0 mt-0.5 ${activityToneStyles[a.tone]}`}
                  >
                    {a.time}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-[#E6E8EC] leading-snug">
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
        <div className="fixed bottom-6 right-6 z-50 bg-[#0E172C] border border-[#1E3563] text-[#E6E8EC] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toast.type === 'warning' ? (
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          ) : toast.type === 'info' ? (
            <Sparkles className="w-4 h-4 text-[#00C2FF] shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="font-medium leading-relaxed">{toast.text}</span>
        </div>
      )}
    </div>
  );
};