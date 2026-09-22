import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarPlus,
  RefreshCw,
  Search,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  AlarmClockOff,
} from 'lucide-react';
import { ScheduleItem, ScheduleStatus, scheduleTimestamp } from '../../types/scheduling';
import {
  NewScheduleInput,
  useSchedules,
  refreshSchedules,
  addSchedule,
  cancelSchedule,
  retrySchedule,
  removeSchedule,
} from '../../services/scheduling/schedulingStore';
import { useWhatsAppAccounts } from '../../services/whatsApp/useWhatsAppAccounts';
import { useWhatsAppGroupConfig } from '../../services/whatsApp/groupConfigStore';
import { getGroupDisplayName } from '../../types/whatsApp';
import { SchedulingSummaryCards } from './SchedulingSummaryCards';
import { SchedulingTable } from './SchedulingTable';
import { NewScheduleModal } from './NewScheduleModal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

type FilterTab = 'all' | ScheduleStatus;

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'scheduled', label: 'Agendados' },
  { id: 'running', label: 'Executando' },
  { id: 'executed', label: 'Executados' },
  { id: 'failed', label: 'Falharam' },
  { id: 'cancelled', label: 'Cancelados' },
];

// Polling leve de status enquanto a página está aberta. Apenas ATUALIZA a tela
// com os status reais do backend — quem executa agendamento é o executor
// server-side (Railway), nunca este frontend.
const POLL_INTERVAL_MS = 10_000;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Falha na operação.';
}

export const SchedulingPage: React.FC = () => {
  const { items: schedules, loading, error } = useSchedules();
  const { accounts } = useWhatsAppAccounts();
  const { groups } = useWhatsAppGroupConfig();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{
    text: string;
    type?: 'success' | 'info' | 'warning';
  } | null>(null);

  const showToast = (
    text: string,
    type: 'success' | 'info' | 'warning' = 'success'
  ) => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Polling leve (somente leitura): reflete automaticamente os status reais
  // do backend. NUNCA executa/dispara agendamento.
  useEffect(() => {
    const timer = setInterval(() => {
      refreshSchedules().catch(() => {
        // falha de rede: o store marca error e a UI já tem o estado de erro
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const accountLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const acc of accounts) {
      map[acc.sessionId] = acc.displayName || acc.name || acc.number;
    }
    return map;
  }, [accounts]);

  const groupLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const group of groups) {
      map[group.id] = getGroupDisplayName(group);
    }
    return map;
  }, [groups]);

  const tabCounts = useMemo(() => {
    return {
      all: schedules.length,
      scheduled: schedules.filter((s) => s.status === 'scheduled').length,
      running: schedules.filter((s) => s.status === 'running').length,
      executed: schedules.filter((s) => s.status === 'executed').length,
      failed: schedules.filter((s) => s.status === 'failed').length,
      cancelled: schedules.filter((s) => s.status === 'cancelled').length,
    };
  }, [schedules]);

  const filteredItems = useMemo(() => {
    let result = [...schedules];

    if (activeTab !== 'all') {
      result = result.filter((s) => s.status === activeTab);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.accountName.toLowerCase().includes(q) ||
          s.groupName.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => scheduleTimestamp(a) - scheduleTimestamp(b));
    return result;
  }, [schedules, activeTab, searchQuery]);

  const handleCreate = async (input: NewScheduleInput): Promise<boolean> => {
    try {
      const created = await addSchedule(input);
      showToast(
        `Agendamento "${created.title}" criado para ${created.date} às ${created.time}.`
      );
      return true;
    } catch (err) {
      showToast(errorMessage(err), 'warning');
      return false;
    }
  };

  const handleCancel = async (item: ScheduleItem) => {
    setPendingId(item.id);
    try {
      await cancelSchedule(item.id);
      showToast(`Agendamento "${item.title}" cancelado.`, 'info');
    } catch (err) {
      showToast(errorMessage(err), 'warning');
    } finally {
      setPendingId(null);
    }
  };

const handleRetry = async (item: ScheduleItem) => {
  if (
    item.deliveryUncertain &&
    !window.confirm(
      'Não foi possível confirmar se a mensagem anterior foi enviada. Verifique o destino antes de reenviar para evitar duplicidade.'
    )
  ) {
    return;
  }
  setPendingId(item.id);
  try {
    await retrySchedule(item.id);
    showToast(
      `Agendamento "${item.title}" reagendado para nova tentativa.`,
      'info'
    );
  } catch (err) {
    showToast(errorMessage(err), 'warning');
  } finally {
    setPendingId(null);
  }
};

  const handleRemove = async (item: ScheduleItem) => {
    setPendingId(item.id);
    try {
      await removeSchedule(item.id);
      showToast(`Agendamento "${item.title}" removido.`, 'info');
    } catch (err) {
      showToast(errorMessage(err), 'warning');
    } finally {
      setPendingId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSchedules();
    } catch {
      showToast('Não foi possível sincronizar os agendamentos.', 'warning');
    } finally {
      setRefreshing(false);
    }
  };

  const isLoading = loading && schedules.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#172033] tracking-tight">
            Agendamentos
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Planeje e automatize suas publicações para envio na data e hora
            programadas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={handleRefresh}
            loading={refreshing}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Sincronizar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsNewModalOpen(true)}
            leftIcon={<CalendarPlus className="w-4 h-4" />}
          >
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Erro de carregamento */}
      {error && schedules.length === 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs">
            <AlarmClockOff className="w-5 h-5 text-red-700 shrink-0" />
            <p className="text-red-700">
              <span className="font-semibold">Erro ao carregar agendamentos:</span>{' '}
              {error}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Loading inicial */}
      {isLoading ? (
        <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl py-16 px-6 text-center">
          <RefreshCw className="w-6 h-6 text-[#2563EB] animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#172033]">
            Carregando agendamentos...
          </p>
          <p className="text-xs text-[#64748B] mt-1">
            Sincronizando com o servidor do PULSE FLOW.
          </p>
        </div>
      ) : error ? (
        <></>
      ) : (
        <>
          {/* Resumo */}
          <SchedulingSummaryCards items={schedules} />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {FILTER_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-[#2563EB] text-white shadow-sm shadow-[#2563EB]/20 font-semibold'
                        : 'text-[#94A3B8] hover:text-[#172033] hover:bg-[#FFFFFF]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono-numeric ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                      }`}
                    >
                      {tabCounts[tab.id]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="w-full lg:w-64">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar agendamento..."
                leftIcon={<Search className="w-3.5 h-3.5" />}
                rightIcon={
                  searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Limpar busca"
                    >
                      <X className="w-3.5 h-3.5 text-[#94A3B8] hover:text-[#172033]" />
                    </button>
                  ) : undefined
                }
              />
            </div>
          </div>

          {/* Vazio */}
          {schedules.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto mb-3">
                <CalendarPlus className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#172033]">
                Nenhum agendamento ainda
              </p>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                Clique em "Novo Agendamento" para programar sua primeira
                publicação. O PULSE FLOW realizará o envio automaticamente na
                data e hora programadas.
              </p>
            </div>
          ) : (
            <SchedulingTable
              items={filteredItems}
              accountLabels={accountLabels}
              groupLabels={groupLabels}
              pendingId={pendingId}
              onCancel={handleCancel}
              onRetry={handleRetry}
              onRemove={handleRemove}
            />
          )}
        </>
      )}

      {/* Modal */}
      <NewScheduleModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        accounts={accounts}
        groups={groups}
        onSubmit={handleCreate}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#FFFFFF] border border-[#BFDBFE] text-[#172033] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toast.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          ) : toast.type === 'info' ? (
            <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          )}
          <span className="font-medium leading-relaxed">{toast.text}</span>
        </div>
      )}
    </div>
  );
};