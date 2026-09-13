import React, { useMemo, useState } from 'react';
import {
  Store,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Save,
  Zap,
  X,
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  sanitizeAffiliateError,
  saveShopeeCredentials,
  testShopeeConnection,
  ShopeeCredentialsView,
} from '../../services/affiliatePrograms/affiliateProgramsService';

const MAX_SUB_IDS = 5;

const EMPTY_SUB_IDS: string[] = [''];

interface ShopeeForm {
  appId: string;
  secret: string;
  enabled: boolean;
  subIds: string[];
}

interface ShopeeConfigPanelProps {
  tenantId: string | null;
  view: ShopeeCredentialsView | null;
  loading: boolean;
  onViewChange: (view: ShopeeCredentialsView | null) => void;
  onClose: () => void;
}

export const ShopeeConfigPanel: React.FC<ShopeeConfigPanelProps> = ({
  tenantId,
  view,
  loading,
  onViewChange,
  onClose,
}) => {
  const [form, setForm] = useState<ShopeeForm>({
    appId: '',
    secret: '',
    enabled: view?.enabled ?? true,
    subIds:
      view && view.subIds && view.subIds.length > 0
        ? [...view.subIds]
        : [...EMPTY_SUB_IDS],
  });
  const [showSecret, setShowSecret] = useState(false);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [testNotice, setTestNotice] = useState<{
    kind: 'success' | 'error';
    message: string;
  } | null>(null);

  const inputLocked = !tenantId || loading;

  const badge = useMemo(() => {
    if (loading)
      return {
        label: 'Carregando…',
        className: 'bg-[#FFFFFF] text-[#64748B] border-[#DCE3EC]',
      };
    if (!view || !view.configured)
      return {
        label: 'Não configurado',
        className: 'bg-[#FFFFFF] text-[#64748B] border-[#DCE3EC]',
      };
    if (view.status === 'connected')
      return {
        label: 'Conectado',
        className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
      };
    if (view.status === 'error')
      return {
        label: 'Erro',
        className: 'bg-rose-500/10 text-rose-700 border-rose-500/30',
      };
    return {
      label: 'Configurado',
      className: 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30',
    };
  }, [loading, view]);

  const updateSubId = (index: number, value: string) => {
    setForm((prev) => {
      const next = [...prev.subIds];
      next[index] = value;
      return { ...prev, subIds: next };
    });
  };

  const addSubId = () => {
    setForm((prev) =>
      prev.subIds.length >= MAX_SUB_IDS
        ? prev
        : { ...prev, subIds: [...prev.subIds, ''] }
    );
  };

  const removeSubId = (index: number) => {
    setForm((prev) =>
      prev.subIds.length <= 1
        ? prev
        : { ...prev, subIds: prev.subIds.filter((_, i) => i !== index) }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || saving) return;
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    setTestNotice(null);
    try {
      const nextView = await saveShopeeCredentials(tenantId, {
        appId: form.appId.trim() !== '' ? form.appId.trim() : undefined,
        secret: form.secret.trim() !== '' ? form.secret.trim() : undefined,
        enabled: form.enabled,
        subIds: form.subIds.map((s) => s.trim()).filter(Boolean),
      });
      onViewChange(nextView);
      setForm({
        appId: '',
        secret: '',
        enabled: nextView.enabled,
        subIds:
          nextView.subIds && nextView.subIds.length > 0
            ? [...nextView.subIds]
            : [...EMPTY_SUB_IDS],
      });
      setShowSecret(false);
      setSaved(true);
    } catch (err) {
      setSaveError(sanitizeAffiliateError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!tenantId || testing) return;
    setTesting(true);
    setTestNotice(null);
    setSaveError(null);
    try {
      const result = await testShopeeConnection(tenantId);
      onViewChange(
        view
          ? {
              ...view,
              status: result.status,
              lastError:
                result.status === 'error' ? result.error ?? null : null,
              lastTestedAt: new Date().toISOString(),
            }
          : view
      );
      if (result.status === 'connected') {
        setTestNotice({
          kind: 'success',
          message: 'Conexão OK — credenciais validadas pela Shopee.',
        });
      } else if (result.status === 'error') {
        setTestNotice({
          kind: 'error',
          message: result.error || 'Falha na conexão com a Shopee.',
        });
      } else {
        setTestNotice({
          kind: 'error',
          message: result.error || 'Credenciais incompletas para testar.',
        });
      }
    } catch (err) {
      setTestNotice({ kind: 'error', message: sanitizeAffiliateError(err) });
    } finally {
      setTesting(false);
    }
  };

  const testDisabled =
    !tenantId || loading || saving || testing || !view?.configured;

  return (
    <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Shopee</h4>
            <p className="text-[10px] text-[#64748B] mt-0.5">
              Programa de Afiliados · Open Platform
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badge.className}`}
          >
            {badge.label}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#64748B] hover:text-[#172033]"
            aria-label="Fechar configuração"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-700 flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-medium">
            Credenciais Shopee salvas com sucesso.
          </span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-700 flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
          <span className="font-medium">{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* App ID */}
          <div>
            <label className="text-[#64748B] text-[11px] block mb-1">
              App ID
            </label>
            <input
              type="text"
              value={form.appId}
              disabled={inputLocked}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, appId: e.target.value }))
              }
              placeholder={view?.appIdMasked ?? 'ex.: 10012345'}
              className="w-full bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB] disabled:opacity-45 disabled:pointer-events-none"
            />
            {view?.appIdMasked && form.appId === '' && (
              <p className="text-[10px] text-[#64748B] mt-1">
                App ID atual:{' '}
                <span className="font-mono">{view.appIdMasked}</span>
              </p>
            )}
          </div>

          {/* Secret */}
          <div>
            <label className="text-[#64748B] text-[11px] block mb-1">
              Secret
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={form.secret}
                disabled={inputLocked}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, secret: e.target.value }))
                }
                placeholder={
                  view?.configured ? '••••••••' : 'Secret da Open Platform'
                }
                className="w-full bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB] disabled:opacity-45 disabled:pointer-events-none pr-9"
              />
              <button
                type="button"
                onClick={() => setShowSecret((s) => !s)}
                disabled={inputLocked}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#172033] disabled:opacity-40"
                aria-label={showSecret ? 'Ocultar secret' : 'Exibir secret'}
              >
                {showSecret ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {view?.configured && form.secret === '' && (
              <p className="text-[10px] text-[#64748B] mt-1 flex items-center gap-1">
                <KeyRound className="w-3 h-3" />
                Segredo salvo no servidor — digite um novo apenas para
                substituí-lo.
              </p>
            )}
            {!view?.configured && (
              <p className="text-[10px] text-[#64748B] mt-1">
                O segredo nunca é exibido, registrado em logs ou armazenado no
                navegador.
              </p>
            )}
          </div>
        </div>

        {/* Sub IDs */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[#64748B] text-[11px] block">
              Sub IDs ({form.subIds.length}/{MAX_SUB_IDS})
            </label>
            <button
              type="button"
              onClick={addSubId}
              disabled={inputLocked || form.subIds.length >= MAX_SUB_IDS}
              className="text-[10px] font-medium text-[#2563EB] hover:text-[#3AD6FF] disabled:text-[#64748B] disabled:pointer-events-none inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Adicionar Sub ID
            </button>
          </div>
          {form.subIds.map((subId, index) => (
            <div
              key={index}
              className="flex items-center gap-2 mb-1.5 last:mb-0"
            >
              <input
                type="text"
                value={subId}
                disabled={inputLocked}
                onChange={(e) => updateSubId(index, e.target.value)}
                placeholder={`Sub ID ${index + 1}`}
                className="w-full bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB] disabled:opacity-45 disabled:pointer-events-none"
              />
              {form.subIds.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSubId(index)}
                  disabled={inputLocked || form.subIds.length <= 1}
                  className="text-[#64748B] hover:text-rose-700 disabled:opacity-30 shrink-0"
                  aria-label={`Remover Sub ID ${index + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          <p className="text-[10px] text-[#64748B] mt-1">
            Até {MAX_SUB_IDS} sub-IDs para rastrear origens (ex.:{' '}
            <span className="font-mono">canal-whatsapp</span>,{' '}
            <span className="font-mono">blog</span>).
          </p>
        </div>

        {/* Gera links automaticamente */}
        <button
          type="button"
          onClick={() => setForm((prev) => ({ ...prev, enabled: !prev.enabled }))}
          disabled={inputLocked}
          className="w-full flex items-center justify-between gap-3 py-1.5 text-left cursor-pointer group disabled:cursor-not-allowed"
        >
          <div className="min-w-0">
            <span className="text-xs font-medium text-[#172033] block group-hover:text-white">
              Gerar links automaticamente
            </span>
            <span className="text-[10px] text-[#64748B] mt-0.5 block leading-relaxed">
              Ao ativar, novos links de ofertas gerados pelo PULSE FLOW usam
              automaticamente as credenciais da Shopee configuradas aqui.
            </span>
          </div>
          <span
            className={`relative w-9 h-5 rounded-full shrink-0 transition-colors mt-0.5 ${
              form.enabled ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'
            } ${inputLocked ? 'opacity-45' : ''}`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                form.enabled ? 'left-[18px]' : 'left-0.5 bg-[#64748B]'
              }`}
            />
          </span>
        </button>

        {/* Erro de status do último teste */}
        {view?.status === 'error' && view.lastError && (
          <div className="p-3 bg-rose-500/[0.07] border border-rose-500/20 rounded-lg text-[11px] text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{view.lastError}</span>
          </div>
        )}

        {/* Feedback do teste */}
        {testNotice && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in duration-200 ${
              testNotice.kind === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700'
            }`}
          >
            {testNotice.kind === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
            )}
            <span className="font-medium">{testNotice.message}</span>
          </div>
        )}

        <div className="border-t border-[#E2E8F0] pt-4 flex flex-col sm:flex-row gap-2.5 sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={testDisabled}
            className="flex items-center gap-1.5 text-xs"
          >
            <Zap
              className={`w-3.5 h-3.5 text-emerald-700 ${
                testing ? 'animate-pulse' : ''
              }`}
            />
            <span>
              {testing ? 'Testando conexão…' : 'Testar conexão Shopee'}
            </span>
          </Button>
          <div className="flex items-center gap-3">
            {!view?.configured && (
              <span className="text-[10px] text-[#64748B]">
                Cadastre App ID e Secret para testar a conexão.
              </span>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={inputLocked || saving || testing}
              className="flex items-center gap-1.5 text-xs"
            >
              {saving ? (
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{saving ? 'Salvando…' : 'Salvar'}</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};