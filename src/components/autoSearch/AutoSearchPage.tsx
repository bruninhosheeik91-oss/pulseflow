import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Info,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Status } from '../ui/Status';
import { AutoSearchFormScreen } from './AutoSearchFormScreen';
import {
  AutoSearchAutomation,
  AutoSearchConfigView,
  deleteAutoSearchAutomation,
  getAutoSearchConfig,
  getCurrentTenantId,
  listAutoSearchAutomations,
  sanitizeAffiliateError,
  updateAutoSearchAutomation,
} from '../../services/affiliatePrograms/affiliateProgramsService';

export const AutoSearchPage: React.FC = () => {
  const tenantId = useMemo(() => getCurrentTenantId(), []);

  const [screen, setScreen] = useState<'list' | 'form'>('list');
  const [editing, setEditing] = useState<AutoSearchAutomation | null>(null);
  const [listVersion, setListVersion] = useState(0);

  const [automations, setAutomations] = useState<AutoSearchAutomation[]>([]);
  const [loadingAutomations, setLoadingAutomations] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sourceConfig, setSourceConfig] = useState<AutoSearchConfigView | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' = 'success') => {
    setToast({ text, type });
    window.setTimeout(() => setToast(null), 3600);
  }, []);

  const loadAutomations = useCallback(async () => {
    if (!tenantId) return;
    setLoadingAutomations(true);
    try {
      setAutomations(await listAutoSearchAutomations(tenantId));
    } catch (err) {
      showToast(`Falha ao carregar automações: ${sanitizeAffiliateError(err)}`, 'info');
    } finally {
      setLoadingAutomations(false);
    }
  }, [tenantId, listVersion, showToast]);

  const loadConfig = useCallback(async () => {
    if (!tenantId) return;
    try {
      setSourceConfig(await getAutoSearchConfig(tenantId));
    } catch {
      setSourceConfig(null);
    }
  }, [tenantId]);

  useEffect(() => {
    void loadAutomations();
    void loadConfig();
  }, [loadAutomations, loadConfig]);

  const openNew = () => {
    setEditing(null);
    setScreen('form');
  };

  const openEdit = (automation: AutoSearchAutomation) => {
    setEditing(automation);
    setScreen('form');
  };

  const closeForm = () => {
    setScreen('list');
    setListVersion((v) => v + 1);
  };

  const handleDelete = async (automation: AutoSearchAutomation) => {
    if (!tenantId) return;
    if (!window.confirm(`Excluir a automação "${automation.name}"?`)) return;
    setDeletingId(automation.id);
    try {
      await deleteAutoSearchAutomation(tenantId, automation.id);
      await loadAutomations();
      showToast('Automação excluída.');
    } catch (err) {
      showToast(`Falha ao excluir: ${sanitizeAffiliateError(err)}`, 'info');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (automation: AutoSearchAutomation) => {
    if (!tenantId) return;
    try {
      await updateAutoSearchAutomation(tenantId, automation.id, {
        active: !automation.active,
      });
      await loadAutomations();
      showToast(automation.active ? 'Automação desativada.' : 'Automação ativada.', 'info');
    } catch (err) {
      showToast(`Falha ao atualizar: ${sanitizeAffiliateError(err)}`, 'info');
    }
  };

  if (screen === 'form' && tenantId) {
    return (
      <AutoSearchFormScreen
        key={editing?.id ?? 'nova-automacao'}
        tenantId={tenantId}
        initial={editing}
        defaultName={
          editing ? undefined : `Busca Shopee ${automations.length + 1}`
        }
        onExit={closeForm}
      />
    );
  }

  const activeCount = automations.filter((automation) => automation.active).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#172033] tracking-tight">
              Busca Automática
            </h1>
            <Status
              variant={activeCount > 0 ? 'active' : 'idle'}
              size="sm"
              label={activeCount > 0 ? `${activeCount} ativa(s)` : 'Sem automação ativa'}
            />
            {sourceConfig?.configured && (
              <Badge variant="info" size="xs">
                Shopee conectado
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Encontre ofertas reais da Shopee, gere links afiliados e prepare a divulgação.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => void loadAutomations()} className="text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAutomations ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={openNew}
            disabled={!tenantId}
            className="text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            + Nova Automação
          </Button>
        </div>
      </div>

      {!tenantId && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Nenhum tenant identificado (X-Tenant-Id). A Busca Automática permanece desligada até
            existir um tenant autenticado.
          </p>
        </div>
      )}

      <Card>
        <CardHeader
          title="Automações"
          subtitle="Configurações salvas no backend real deste tenant"
          action={
            <Badge variant="neutral" size="xs">
              {automations.length} cadastrada(s)
            </Badge>
          }
        />
        <CardContent className="space-y-2">
          {automations.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Search className="w-5 h-5 text-[#64748B]" />
              <p className="text-xs text-[#64748B]">Nenhuma automação criada ainda.</p>
              <Button variant="primary" size="sm" onClick={openNew} disabled={!tenantId} className="text-xs">
                <Plus className="w-3.5 h-3.5" />
                Criar primeira automação
              </Button>
            </div>
          ) : (
            automations.map((automation) => {
              const groupCount = automation.destination.groupIds.length;
              return (
                <div
                  key={automation.id}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#BFDBFE] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => openEdit(automation)}
                    className="flex-1 flex items-center gap-2 min-w-0 text-left cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#172033] truncate">
                          {automation.name}
                        </span>
                        <Badge
                          variant={automation.active ? 'success' : 'neutral'}
                          size="xs"
                        >
                          {automation.active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-[#64748B] block mt-0.5">
                        Shopee · {groupCount} grupo(s) · a cada{' '}
                        {automation.schedule.intervalMinutes} min
                      </span>
                    </div>
                    <span className="text-[10px] text-[#2563EB] flex items-center gap-1 shrink-0">
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(automation)}
                    title={automation.active ? 'Desativar' : 'Ativar'}
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(automation)}
                    disabled={deletingId === automation.id}
                    title="Excluir"
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-red-700 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {sourceConfig && (
        <Card>
          <CardHeader
            title="Fonte Shopee"
            subtitle="Estado real da integração para este tenant"
          />
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-[10px] text-[#64748B] block">Configurada</span>
                <span
                  className={`text-xs font-bold mt-0.5 block ${
                    sourceConfig.configured ? 'text-emerald-700' : 'text-[#64748B]'
                  }`}
                >
                  {sourceConfig.configured ? 'Sim' : 'Não'}
                </span>
              </div>
              <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-[10px] text-[#64748B] block">Status</span>
                <span className="text-xs font-bold text-[#172033] mt-0.5 block">
                  {sourceConfig.status}
                </span>
              </div>
              <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-[10px] text-[#64748B] block">App ID</span>
                <span className="text-xs font-mono-numeric font-bold text-[#172033] mt-0.5 block">
                  {sourceConfig.appIdMasked || '—'}
                </span>
              </div>
              <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-[10px] text-[#64748B] block">Sub IDs</span>
                <span className="text-xs font-mono-numeric font-bold text-[#172033] mt-0.5 block">
                  {sourceConfig.subIds.join(', ') || '—'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#FFFFFF] border border-[#BFDBFE] text-[#172033] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
          )}
          <span className="font-medium leading-relaxed">{toast.text}</span>
        </div>
      )}
    </div>
  );
};