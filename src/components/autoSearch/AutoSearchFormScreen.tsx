import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  Filter,
  Image,
  Info,
  Lightbulb,
  Link2,
  MessageSquare,
  Play,
  Save,
  Search,
  Send,
  ShieldCheck,
  Store,
  Tags,
  Users,
  XCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { MarketplaceBadge } from '../ui/MarketplaceBadge';
import {
  AutoSearchAccountDestination,
  AutoSearchAutomation,
  AutoSearchAutomationPayload,
  AutoSearchConfigView,
  AutoSearchFilters,
  AutoSearchPriority,
  AutoSearchRunProduct,
  AutoSearchRunResult,
  AutoSearchSendRecord,
  createAutoSearchAutomation,
  getAutoSearchConfig,
  getAutoSearchDestinations,
  runAutoSearch,
  sanitizeAffiliateError,
  sendAutoSearchTest,
  updateAutoSearchAutomation,
} from '../../services/affiliatePrograms/affiliateProgramsService';

interface AutomationDraft {
  id?: string;
  name: string;
  active: boolean;
  destination: { accountId: string; groupIds: string[] };
  schedule: {
    startDate: string;
    endDate: string;
    timeStart: string;
    timeEnd: string;
    intervalMinutes: number;
  };
  categories: { general: boolean; categoryId: number | null };
  filters: AutoSearchFilters;
  maxResults: number;
  priority: AutoSearchPriority;
  messageTemplate: string;
}

const DEFAULTS: AutomationDraft = {
  name: '',
  active: true,
  destination: { accountId: '', groupIds: [] },
  schedule: {
    startDate: '',
    endDate: '',
    timeStart: '09:00',
    timeEnd: '18:00',
    intervalMinutes: 60,
  },
  categories: { general: true, categoryId: null },
  filters: {
    minPrice: null,
    maxPrice: null,
    minDiscount: null,
    minCommission: null,
    minSales: null,
    minRating: null,
  },
  maxResults: 5,
  priority: 'desconto',
  messageTemplate:
    'OFERTA! {{produto}}\nDe R$ {{preco_original}} por R$ {{preco}}\n{{desconto}}% OFF\nLink: {{link}}',
};

const PRIORITY_OPTIONS: { value: AutoSearchPriority; label: string; desc: string }[] = [
  { value: 'desconto', label: 'Maior desconto', desc: 'Prioriza o maior % de desconto real.' },
  { value: 'comissao', label: 'Maior comissão', desc: 'Prioriza a maior comissão em R$.' },
  { value: 'vendas', label: 'Mais vendidos', desc: 'Prioriza os produtos mais vendidos.' },
  { value: 'avaliacao', label: 'Melhor avaliação', desc: 'Prioriza a melhor avaliação real.' },
  { value: 'variedade', label: 'Variedade', desc: 'Diversifica os vendedores nas ofertas.' },
];

const ACCOUNT_STATUS_LABEL: Record<string, string> = {
  connected: 'Conectado',
  connecting: 'Conectando',
  awaiting_qr: 'Aguardando QR',
  disconnected: 'Desconectado',
  error: 'Erro',
  starting: 'Iniciando',
};

const TEMPLATE_VARIABLES: { key: string; desc: string }[] = [
  { key: '{{produto}}', desc: 'Nome real do produto' },
  { key: '{{preco}}', desc: 'Preço de venda' },
  { key: '{{preco_original}}', desc: 'Preço original' },
  { key: '{{desconto}}', desc: 'Percentual de desconto' },
  { key: '{{comissao}}', desc: 'Comissão estimada em R$' },
  { key: '{{vendedor}}', desc: 'Nome da loja' },
  { key: '{{avaliacao}}', desc: 'Avaliação real do produto' },
  { key: '{{vendas}}', desc: 'Quantidade de vendas' },
  { key: '{{link}}', desc: 'Short link afiliado gerado' },
];

interface Props {
  tenantId: string;
  initial: AutoSearchAutomation | null;
  defaultName?: string;
  onExit: () => void;
}

function numberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function formatBRL(value: number | null): string {
  return value == null ? '—' : `R$ ${value.toFixed(2)}`;
}

function formatSales(value: number): string {
  if (value <= 0) return '0 vendas';
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace('.', ',')} mil vendas`;
  }
  return `${value} vendas`;
}

function fillTemplate(template: string, product: AutoSearchRunProduct): string {
  return (template || '')
    .replace(/{{produto}}/g, product.productName || 'Produto')
    .replace(/{{preco}}/g, formatBRL(product.price))
    .replace(/{{preco_original}}/g, formatBRL(product.originalPrice))
    .replace(/{{desconto}}/g, String(product.discountPercentage ?? 0))
    .replace(/{{comissao}}/g, formatBRL(product.commissionAmount))
    .replace(/{{vendedor}}/g, product.shopName || '—')
    .replace(/{{avaliacao}}/g, product.rating != null ? String(product.rating) : '—')
    .replace(/{{vendas}}/g, formatSales(product.sales))
    .replace(/{{link}}/g, product.affiliateUrl || product.productLink || '');
}

function fromAutomation(automation: AutoSearchAutomation): AutomationDraft {
  return {
    id: automation.id,
    name: automation.name,
    active: automation.active,
    destination: { ...automation.destination },
    schedule: { ...automation.schedule },
    categories: { ...automation.categories },
    filters: { ...automation.filters },
    maxResults: automation.maxResults,
    priority: automation.priority,
    messageTemplate: automation.messageTemplate,
  };
}

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ icon, title, subtitle, children }) => (
  <Card>
    <CardHeader
      title={
        <span className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#1E5EFF]/15 border border-[#1E5EFF]/30 flex items-center justify-center shrink-0">
            {icon}
          </span>
          {title}
        </span>
      }
      subtitle={subtitle}
    />
    <CardContent className="space-y-4">{children}</CardContent>
  </Card>
);

export const AutoSearchFormScreen: React.FC<Props> = ({
  tenantId,
  initial,
  defaultName,
  onExit,
}) => {
  const [draft, setDraft] = useState<AutomationDraft>(() =>
    initial ? fromAutomation(initial) : { ...DEFAULTS, name: defaultName ?? '' }
  );

  const [accounts, setAccounts] = useState<AutoSearchAccountDestination[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');

  const [sourceConfig, setSourceConfig] = useState<AutoSearchConfigView | null>(null);
  const [runResult, setRunResult] = useState<AutoSearchRunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AutoSearchRunProduct | null>(null);
  const [sendTarget, setSendTarget] = useState<{
    automationId: string;
    product: AutoSearchRunProduct;
    groupId: string;
  } | null>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<AutoSearchSendRecord | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' = 'success') => {
    setToast({ text, type });
    window.setTimeout(() => setToast(null), 3600);
  }, []);

  const loadDestinations = useCallback(async () => {
    setLoadingDestinations(true);
    try {
      const list = await getAutoSearchDestinations(tenantId);
      setAccounts(list);
    } catch (err) {
      showToast(`Falha ao carregar destinos: ${sanitizeAffiliateError(err)}`, 'info');
    } finally {
      setLoadingDestinations(false);
    }
  }, [tenantId, showToast]);

  const loadConfig = useCallback(async () => {
    try {
      setSourceConfig(await getAutoSearchConfig(tenantId));
    } catch {
      setSourceConfig(null);
    }
  }, [tenantId]);

  useEffect(() => {
    void loadDestinations();
    void loadConfig();
  }, [loadDestinations, loadConfig]);

  const selectedAccount = draft.destination.accountId
    ? accounts.find((account) => account.id === draft.destination.accountId) || null
    : null;
  const accountConnected = selectedAccount?.status === 'connected';

  const filteredGroups = useMemo(() => {
    const source = selectedAccount?.groups || [];
    const q = groupSearch.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (group) =>
        (group.name || '').toLowerCase().includes(q) || group.id.toLowerCase().includes(q)
    );
  }, [selectedAccount, groupSearch]);

  const qualifiedCount = runResult?.qualified ?? 0;
  const ignoredCount = runResult?.ignored ?? 0;

  const buildPayload = (): AutoSearchAutomationPayload => ({
    name: draft.name,
    active: draft.active,
    destination: draft.destination,
    schedule: draft.schedule,
    categories: draft.categories,
    filters: draft.filters,
    maxResults: draft.maxResults,
    priority: draft.priority,
    messageTemplate: draft.messageTemplate,
  });

  const handleSave = async () => {
    if (!draft.name.trim()) {
      showToast('Informe um nome para a automação.', 'info');
      return;
    }
    setSaving(true);
    try {
      if (draft.id) {
        await updateAutoSearchAutomation(tenantId, draft.id, buildPayload());
        showToast('Automação atualizada.');
      } else {
        await createAutoSearchAutomation(tenantId, buildPayload());
        showToast('Automação criada.');
      }
      onExit();
    } catch (err) {
      showToast(`Falha ao salvar: ${sanitizeAffiliateError(err)}`, 'info');
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const payload = {
        maxResults: draft.maxResults,
        priority: draft.priority,
        categoryId: draft.categories.general ? null : draft.categories.categoryId,
        filters: draft.filters,
      };
      const result = await runAutoSearch(tenantId, payload);
      setRunResult(result);
      if (result.ok) {
        showToast(
          `${result.qualified} produto(s) aprovado(s) · ${result.shortLinksGenerated ?? 0} short link(s).`
        );
      } else {
        showToast(result.error || 'Falha na busca.', 'info');
      }
    } catch (err) {
      showToast(`Falha na busca: ${sanitizeAffiliateError(err)}`, 'info');
    } finally {
      setRunning(false);
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copiado para a área de transferência.');
    } catch {
      showToast('Não foi possível copiar.', 'info');
    }
  };

  const handleChangeAccount = (accountId: string) => {
    setDraft((prev) => ({ ...prev, destination: { accountId, groupIds: [] } }));
    setGroupSearch('');
  };

  const openSendConfirm = (product: AutoSearchRunProduct) => {
    if (!draft.id) {
      showToast('Salve a automação antes de enviar o teste.', 'info');
      return;
    }
    if (!draft.destination.groupIds.length) {
      showToast('Adicione ao menos 1 grupo de destino e salve a automação.', 'info');
      return;
    }
    if (product.itemId == null) {
      showToast('Produto sem identificador para envio.', 'info');
      return;
    }
    if (!product.affiliateUrl) {
      showToast('O short link precisa estar gerado para enviar.', 'info');
      return;
    }
    setSendResult(null);
    setSendError(null);
    setSendTarget({
      automationId: draft.id,
      product,
      groupId: draft.destination.groupIds[0],
    });
  };

  const handleConfirmSend = async () => {
    if (!sendTarget) return;
    setSending(true);
    setSendError(null);
    try {
      const result = await sendAutoSearchTest(tenantId, sendTarget.automationId, {
        itemId: sendTarget.product.itemId as number,
        groupId: sendTarget.groupId,
      });
      setSendResult(result.send);
      if (result.send.status === 'sent') {
        showToast('Teste enviado ao WhatsApp.');
      }
    } catch (err) {
      setSendError(sanitizeAffiliateError(err));
    } finally {
      setSending(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setDraft((prev) => {
      const has = prev.destination.groupIds.includes(groupId);
      return {
        ...prev,
        destination: {
          ...prev.destination,
          groupIds: has
            ? prev.destination.groupIds.filter((g) => g !== groupId)
            : [...prev.destination.groupIds, groupId],
        },
      };
    });
  };

  const selectAllGroups = () => {
    if (!selectedAccount) return;
    setDraft((prev) => ({
      ...prev,
      destination: { ...prev.destination, groupIds: (selectedAccount.groups || []).map((g) => g.id) },
    }));
    setGroupSearch('');
  };

  const clearGroups = () => {
    setDraft((prev) => ({ ...prev, destination: { ...prev.destination, groupIds: [] } }));
  };

  const setFilter = (key: keyof AutoSearchFilters, value: string) => {
    setDraft((prev) => ({ ...prev, filters: { ...prev.filters, [key]: numberOrNull(value) } }));
  };

  const filterRows: { key: keyof AutoSearchFilters; label: string; placeholder: string }[] = [
    { key: 'minPrice', label: 'Preço mínimo', placeholder: 'R$' },
    { key: 'maxPrice', label: 'Preço máximo', placeholder: 'R$' },
    { key: 'minDiscount', label: 'Desconto mínimo', placeholder: '%' },
    { key: 'minCommission', label: 'Comissão mínima', placeholder: 'R$' },
    { key: 'minSales', label: 'Vendas mínimas', placeholder: 'un.' },
    { key: 'minRating', label: 'Avaliação mínima', placeholder: '★' },
  ];

  const destinationLabel = useMemo(() => {
    if (!selectedAccount) return 'Nenhuma conta selecionada';
    const names = selectedAccount.groups
      .filter((group) => draft.destination.groupIds.includes(group.id))
      .map((group) => group.name || group.id);
    return `${selectedAccount.name} · ${names.length} grupo(s)${names.length ? `: ${names.join(', ')}` : ''}`;
  }, [selectedAccount, draft.destination.groupIds]);

  const approvedProducts = (runResult?.products || []).filter(
    (product) => product.status === 'qualified'
  );
  const ignoredProducts = (runResult?.products || []).filter(
    (product) => product.status === 'ignored'
  );

  const targetGroups = useMemo(() => {
    if (!selectedAccount) return [];
    const groups = selectedAccount.groups || [];
    return draft.destination.groupIds
      .map((id) => groups.find((group) => group.id === id))
      .filter((group): group is NonNullable<typeof group> => Boolean(group))
      .map((group) => ({ id: group.id, name: group.name || group.id }));
  }, [selectedAccount, draft.destination.groupIds]);

  return (
    <div className="space-y-5">
      {/* Cabeçalho da tela de criação/edição */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onExit}
            title="Voltar para a lista"
            className="p-2 rounded-lg text-[#8E9BAE] hover:text-[#E6E8EC] hover:bg-[#131E38]/80 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-[#E6E8EC] tracking-tight">
                {draft.id ? 'Editar Automação' : 'Nova Automação'}
              </h1>
              <Badge variant={draft.active ? 'success' : 'neutral'} size="xs">
                {draft.active ? 'Ativa' : 'Inativa'}
              </Badge>
              <Badge variant="info" size="xs">
                Shopee real
              </Badge>
            </div>
            <p className="text-xs text-[#8E9BAE] mt-1">
              {draft.id
                ? 'Edite a automação salva no backend real do tenant.'
                : 'Configure a automação ligada ao backend real do tenant.'}
            </p>
          </div>
        </div>
        <MarketplaceBadge marketplace="Shopee" size="sm" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ===== Coluna principal ===== */}
        <div className="lg:col-span-8 space-y-5">
          {/* 1 — Configuração Geral */}
          <SectionCard
            icon={<Users className="w-3.5 h-3.5 text-[#00C2FF]" />}
            title="Configuração Geral"
            subtitle="Identificação e modo de operação da automação"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#8E9BAE] block mb-1">Modo de Automação</label>
                <Select
                  options={[{ value: 'busca-promocoes', label: 'Busca de Promoções' }]}
                  value="busca-promocoes"
                  helperText="Modo atual de operação desta tela."
                />
              </div>
              <div>
                <label className="text-[11px] text-[#8E9BAE] block mb-1">Nome da Automação</label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex.: Divulgação de ofertas de Natal"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDraft((prev) => ({ ...prev, active: !prev.active }))}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg bg-[#080E1C] border border-[#14203B] text-left cursor-pointer hover:border-[#1E3057] transition-colors"
            >
              <div>
                <span className="text-xs text-[#94A3B8] block">Ativa / Inativa</span>
                <span className="text-[10px] text-[#64748B] block mt-0.5">
                  {draft.active
                    ? 'A configuração fica ativa para execuções.'
                    : 'Pausada manualmente.'}
                </span>
              </div>
              <span
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  draft.active ? 'bg-[#1E5EFF]' : 'bg-[#1B2947]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    draft.active ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </span>
            </button>
          </SectionCard>

          {/* 2 — Agendamento */}
          <SectionCard
            icon={<Clock className="w-3.5 h-3.5 text-[#00C2FF]" />}
            title="Agendamento"
            subtitle="Nesta etapa apenas a configuração é salva — o scheduler não é iniciado"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#8E9BAE] block mb-1">Data de início (opcional)</label>
                <Input
                  type="date"
                  value={draft.schedule.startDate}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      schedule: { ...prev.schedule, startDate: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-[11px] text-[#8E9BAE] block mb-1">Data de fim (opcional)</label>
                <Input
                  type="date"
                  value={draft.schedule.endDate}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      schedule: { ...prev.schedule, endDate: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-[11px] text-[#8E9BAE] block mb-1">Horário de início</label>
                <Input
                  type="time"
                  value={draft.schedule.timeStart}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      schedule: { ...prev.schedule, timeStart: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-[11px] text-[#8E9BAE] block mb-1">Horário de término</label>
                <Input
                  type="time"
                  value={draft.schedule.timeEnd}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      schedule: { ...prev.schedule, timeEnd: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] text-[#8E9BAE] block mb-1">
                  Intervalo de execução
                </label>
                <Select
                  options={[5, 10, 15, 30, 60, 120, 180, 360, 720, 1440].map((min) => ({
                    value: String(min),
                    label: `A cada ${min} minuto(s)`,
                  }))}
                  value={String(draft.schedule.intervalMinutes)}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      schedule: { ...prev.schedule, intervalMinutes: Number(e.target.value) },
                    }))
                  }
                />
              </div>
            </div>
          </SectionCard>

          {/* 3 — Destino (WhatsApp) */}
          <SectionCard
            icon={<MessageSquare className="w-3.5 h-3.5 text-[#00C2FF]" />}
            title="Destino (WhatsApp)"
            subtitle="Conta e grupos reais vindos de /api/affiliate/auto-search/destinations"
          >
            {accounts.length === 0 ? (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#0E2030] border border-[#1C3A4E]">
                <Info className="w-3.5 h-3.5 text-[#00C2FF] shrink-0 mt-0.5" />
                <span className="text-[11px] text-[#94A3B8]">
                  Nenhuma conta WhatsApp real disponível para este tenant.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#8E9BAE] block mb-1">Conta WhatsApp</label>
                  <Select
                    loading={loadingDestinations}
                    options={[
                      { value: '', label: 'Selecionar conta', disabled: true },
                      ...accounts.map((account) => ({
                        value: account.id,
                        label: `${account.name} · ${ACCOUNT_STATUS_LABEL[account.status] || account.status}`,
                      })),
                    ]}
                    value={draft.destination.accountId || ''}
                    onChange={(e) => handleChangeAccount(e.target.value)}
                  />
                </div>

                {selectedAccount && !accountConnected && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#0E2030] border border-[#1C3A4E]">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-[#94A3B8] leading-relaxed">
                      Conta em status real{' '}
                      <strong className="text-amber-300">
                        {ACCOUNT_STATUS_LABEL[selectedAccount.status] || selectedAccount.status}
                      </strong>
                      . Conecte a conta no WhatsApp para carregar os grupos reais — a seleção fica
                      bloqueada.
                    </span>
                  </div>
                )}

                {selectedAccount && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] text-[#8E9BAE]">
                        Grupos ({selectedAccount.groups.length} reais)
                      </label>
                      {accountConnected && selectedAccount.groups.length > 0 && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={selectAllGroups}
                            className="text-[10px] text-[#00C2FF] hover:text-[#33D1FF] cursor-pointer"
                          >
                            Selecionar todos
                          </button>
                          <button
                            type="button"
                            onClick={clearGroups}
                            className="text-[10px] text-[#8E9BAE] hover:text-[#E6E8EC] cursor-pointer"
                          >
                            Limpar seleção
                          </button>
                        </div>
                      )}
                    </div>

                    {accountConnected ? (
                      <>
                        <Input
                          value={groupSearch}
                          onChange={(e) => setGroupSearch(e.target.value)}
                          placeholder="Buscar grupo real..."
                          className="mb-1.5"
                          leftIcon={<Search className="w-3.5 h-3.5" />}
                        />
                        <div className="max-h-44 overflow-y-auto space-y-1">
                          {filteredGroups.length === 0 ? (
                            <p className="text-[11px] text-[#64748B] py-2">
                              {selectedAccount.groups.length === 0
                                ? 'Nenhum grupo sincronizado nesta conta.'
                                : 'Nenhum grupo encontrado para a busca.'}
                            </p>
                          ) : (
                            filteredGroups.map((group) => {
                              const selected = draft.destination.groupIds.includes(group.id);
                              return (
                                <label
                                  key={group.id}
                                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#080E1C] border border-[#14203B] hover:border-[#1E3057] transition-colors cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => toggleGroup(group.id)}
                                    className="w-4 h-4 rounded border-[#374151] bg-[#0A1020] text-[#1E5EFF] focus:ring-[#1E5EFF] focus:ring-offset-0 cursor-pointer"
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span
                                      className={`text-xs block truncate ${selected ? 'text-[#E6E8EC]' : 'text-[#94A3B8]'}`}
                                    >
                                      {group.name || group.id}
                                    </span>
                                    {group.participantCount != null && (
                                      <span className="text-[10px] text-[#64748B]">
                                        {group.participantCount} participantes
                                      </span>
                                    )}
                                  </span>
                                </label>
                              );
                            })
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="px-3 py-2.5 rounded-lg bg-[#080E1C] border border-[#14203B]">
                        <span className="text-[11px] text-[#64748B]">
                          Seleção de grupos desabilitada (sem conta conectada).
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* 4 — Loja / Marketplace */}
          <SectionCard
            icon={<Store className="w-3.5 h-3.5 text-[#00C2FF]" />}
            title="Loja / Marketplace"
            subtitle="Marketplace conectado ao Programa de Afiliados"
          >
            <div className="p-3 rounded-xl bg-[#0B1324] border border-[#162340] space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MarketplaceBadge marketplace="Shopee" size="sm" />
                  <span className="text-xs text-[#94A3B8]">
                    Conectado ao Programa de Afiliados da Shopee
                  </span>
                </div>
                {sourceConfig && (
                  <Badge
                    variant={sourceConfig.configured ? 'success' : 'neutral'}
                    size="xs"
                  >
                    {sourceConfig.configured ? 'Integração configurada' : 'Sem credenciais'}
                  </Badge>
                )}
              </div>
              {sourceConfig && sourceConfig.configured && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-[#080E1C] border border-[#14203B] rounded-lg">
                    <span className="text-[10px] text-[#64748B] block">Status</span>
                    <span className="text-xs font-bold text-[#E6E8EC] mt-0.5 block">
                      {sourceConfig.status}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#080E1C] border border-[#14203B] rounded-lg">
                    <span className="text-[10px] text-[#64748B] block">App ID</span>
                    <span className="text-xs font-mono-numeric font-bold text-[#E6E8EC] mt-0.5 block">
                      {sourceConfig.appIdMasked || '—'}
                    </span>
                  </div>
                  <div className="col-span-2 p-2.5 bg-[#080E1C] border border-[#14203B] rounded-lg">
                    <span className="text-[10px] text-[#64748B] block">Sub IDs vinculados</span>
                    <span className="text-xs font-mono-numeric font-bold text-[#E6E8EC] mt-0.5 block">
                      {sourceConfig.subIds.join(', ') || '—'}
                    </span>
                  </div>
                </div>
              )}
              <p className="text-[10px] text-[#64748B] leading-relaxed">
                App ID e Secret são gerenciados nas Configurações — não são solicitados nesta tela.
              </p>
            </div>
          </SectionCard>

          {/* 5 — Categorias */}
          <SectionCard
            icon={<Tags className="w-3.5 h-3.5 text-[#00C2FF]" />}
            title="Categorias"
            subtitle="Somente dados suportados pelo backend atual — a Shopee API não fornece catálogo de categorias (auditado)"
          >
            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  categories: { ...prev.categories, general: !prev.categories.general },
                }))
              }
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                draft.categories.general
                  ? 'bg-[#121E38] border-[#1E325C]'
                  : 'bg-[#080E1C] border-[#14203B]'
              }`}
            >
              <div>
                <span className="text-xs text-[#E6E8EC] block">Ofertas gerais</span>
                <span className="text-[10px] text-[#64748B] block mt-0.5">
                  Sem filtro de categoria — usa todas as ofertas reais do productOfferV2.
                </span>
              </div>
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  draft.categories.general ? 'border-[#00C2FF] bg-[#00C2FF]/20' : 'border-[#374151]'
                }`}
              >
                {draft.categories.general && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF]" />
                )}
              </span>
            </button>

            <div>
              <label className="text-[11px] text-[#8E9BAE] block mb-1">
                ID de categoria real (productCatId)
              </label>
              <Input
                type="number"
                disabled={draft.categories.general}
                value={draft.categories.categoryId ?? ''}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    categories: { ...prev.categories, categoryId: numberOrNull(e.target.value) },
                  }))
                }
                placeholder="Ex.: 100038"
                helperText="Use apenas um ID real que você conheça para filtrar — nenhum mapeamento é inventado."
              />
            </div>

            <div className="px-3 py-2.5 rounded-lg border border-dashed border-[#1E2E52] bg-[#080E1C]">
              <span className="text-[10px] text-[#64748B] block">
                Quando a API disponibilizar o catálogo, a lista real de categorias será exibida
                aqui — a estrutura deste bloco já está preparada para recebê-la.
              </span>
            </div>
          </SectionCard>

          {/* 6 — Filtros e Prioridade */}
          <SectionCard
            icon={<Filter className="w-3.5 h-3.5 text-[#00C2FF]" />}
            title="Filtros e Prioridade"
            subtitle="Critérios de seleção das ofertas reais"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-[#8E9BAE] block mb-1.5">Prioridade</label>
                <div className="space-y-1.5">
                  {PRIORITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDraft((prev) => ({ ...prev, priority: option.value }))}
                      className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg border text-left cursor-pointer transition-colors ${
                        draft.priority === option.value
                          ? 'bg-[#121E38] border-[#1E325C]'
                          : 'bg-[#080E1C] border-[#14203B] hover:border-[#1E3057]'
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          draft.priority === option.value
                            ? 'border-[#00C2FF] bg-[#00C2FF]/20'
                            : 'border-[#374151]'
                        }`}
                      >
                        {draft.priority === option.value && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF]" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <span
                          className={`text-xs block ${draft.priority === option.value ? 'text-[#E6E8EC]' : 'text-[#94A3B8]'}`}
                        >
                          {option.label}
                        </span>
                        {draft.priority === option.value && (
                          <span className="text-[10px] text-[#64748B] block mt-0.5">
                            {option.desc}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#8E9BAE] block mb-1.5">Filtros</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="col-span-2">
                    <label className="text-[10px] text-[#64748B] block mb-1">
                      Quantidade de produtos (1–5)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={String(draft.maxResults)}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          maxResults: Math.min(5, Math.max(1, Number(e.target.value) || 5)),
                        }))
                      }
                      helperText="Máx. de 5 por consulta (limite real da API)."
                    />
                  </div>
                  {filterRows.map((row) => (
                    <div key={row.key}>
                      <label className="text-[10px] text-[#64748B] block mb-1">{row.label}</label>
                      <Input
                        type="number"
                        value={draft.filters[row.key] ?? ''}
                        onChange={(e) => setFilter(row.key, e.target.value)}
                        placeholder={row.placeholder}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* 7 — Texto de Divulgação */}
          <SectionCard
            icon={<MessageSquare className="w-3.5 h-3.5 text-[#00C2FF]" />}
            title="Texto de Divulgação"
            subtitle="Template preenchido com dados reais do produto"
          >
            <div>
              <label className="text-[11px] text-[#8E9BAE] block mb-1">
                Template / texto de disparo
              </label>
              <textarea
                value={draft.messageTemplate}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, messageTemplate: e.target.value }))
                }
                rows={5}
                className="w-full bg-[#0A1020] border border-[#1B2947] text-[#E6E8EC] rounded-lg px-3 py-2 text-xs leading-relaxed placeholder:text-[#5A6470] focus:outline-none focus:border-[#1E5EFF] resize-y"
                placeholder="Escreva o texto de disparo..."
              />
              <p className="text-[10px] text-[#64748B] mt-1">
                Variáveis suportadas:{' '}
                {TEMPLATE_VARIABLES.map((item) => item.key).join(' ')}
              </p>
            </div>
          </SectionCard>

          {/* 8 — Mídia do Produto */}
          <SectionCard
            icon={<Image className="w-3.5 h-3.5 text-[#00C2FF]" />}
            title="Mídia do Produto"
            subtitle="Apresentação do produto na divulgação"
          >
            <div className="p-3 rounded-xl bg-[#0B1324] border border-[#162340] space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="w-20 h-20 rounded-lg bg-[#080E1C] border border-[#14203B] flex items-center justify-center overflow-hidden shrink-0">
                  {selectedProduct?.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image className="w-6 h-6 text-[#475569]" />
                  )}
                </div>
                <div className="min-w-0 space-y-1">
                  <span className="text-xs text-[#E6E8EC] block">Imagem do produto</span>
                  <span className="text-[10px] text-[#64748B] block leading-relaxed">
                    A imagem real do produto é exibida no preview da divulgação após a busca. Esta
                    etapa não altera o comportamento do backend.
                  </span>
                  <Badge variant="neutral" size="xs">
                    Envio de mídia será habilitado em etapa futura
                  </Badge>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Resultado da busca */}
          <Card>
            <CardHeader
              title="Resultado da busca"
              subtitle={
                runResult
                  ? `Real · ${runResult.consulted ?? 0} consultados, ${qualifiedCount} aprovados, ${ignoredCount} ignorados`
                  : 'Execute uma busca para ver os produtos reais aprovados'
              }
              action={
                runResult ? (
                  <Badge variant="success" size="xs">
                    {runResult.shortLinksGenerated ?? 0} short links
                  </Badge>
                ) : undefined
              }
            />
            <CardContent className="space-y-4">
              {draft.destination.accountId && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#0B1324] border border-[#162340]">
                  <Users className="w-3.5 h-3.5 text-[#00C2FF] shrink-0 mt-0.5" />
                  <span className="text-[11px] text-[#94A3B8] break-words">
                    Destino do preview:{' '}
                    <strong className="text-[#E6E8EC]">{destinationLabel}</strong>
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  ['Consultados', String(runResult?.consulted ?? 0)],
                  ['Aprovados', String(qualifiedCount)],
                  ['Ignorados', String(ignoredCount)],
                  ['Short links', String(runResult?.shortLinksGenerated ?? 0)],
                ].map(([label, value]) => (
                  <div key={label} className="p-2.5 bg-[#080E1C] border border-[#14203B] rounded-lg">
                    <span className="text-[10px] text-[#64748B] block">{label}</span>
                    <span className="text-base font-bold font-mono-numeric text-[#00C2FF] mt-0.5 block">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#00C2FF]">
                    Aprovados
                  </span>
                  <Badge variant="success" size="xs">
                    {qualifiedCount} aprovados
                  </Badge>
                </div>
                {!runResult || qualifiedCount === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <Search className="w-6 h-6 text-[#64748B]" />
                    <p className="text-xs text-[#8E9BAE]">
                      {runResult
                        ? 'Nenhum produto aprovado com os filtros atuais.'
                        : 'Execute uma busca para ver os produtos aprovados.'}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleRun}
                      loading={running}
                      className="text-xs"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Executar busca agora
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#162442]">
                          {['Produto', 'Preço', 'Desc.', 'Avaliação', 'Short link', 'Ações'].map(
                            (h) => (
                              <th
                                key={h}
                                className="px-3 py-2.5 text-left text-[10px] font-semibold text-[#64748B] uppercase tracking-wider whitespace-nowrap"
                              >
                                {h}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {approvedProducts.map((product) => (
                          <tr
                            key={`${product.itemId}-${product.productLink}`}
                            className="border-b border-[#14203B] last:border-0 hover:bg-[#0A1020] transition-colors"
                          >
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={product.imageUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-md object-cover bg-[#14203B] shrink-0"
                                />
                                <div className="min-w-0">
                                  <span className="text-[11px] font-medium text-[#E6E8EC] block truncate max-w-[180px]">
                                    {product.productName}
                                  </span>
                                  <span className="text-[10px] text-[#64748B]">
                                    {product.shopName}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="text-[11px] font-mono-numeric font-bold text-[#E6E8EC]">
                                {formatBRL(product.price)}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <Badge
                                variant={
                                  product.discountPercentage >= 40
                                    ? 'success'
                                    : product.discountPercentage >= 20
                                    ? 'info'
                                    : 'neutral'
                                }
                                size="xs"
                              >
                                {product.discountPercentage}%
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5 text-[11px] text-[#94A3B8]">
                              {product.rating != null ? `${product.rating} ★` : '—'}
                            </td>
                            <td className="px-3 py-2.5">
                              {product.affiliateUrl ? (
                                <button
                                  type="button"
                                  onClick={() => void copyText(product.affiliateUrl as string)}
                                  className="flex items-center gap-1 text-[10px] text-[#00C2FF] hover:text-[#33D1FF] transition-colors cursor-pointer"
                                >
                                  <Link2 className="w-3 h-3" />
                                  <span className="max-w-[120px] truncate">
                                    {product.affiliateUrl}
                                  </span>
                                </button>
                              ) : product.linkError ? (
                                <span className="text-[10px] text-amber-400">
                                  {product.linkError}
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#64748B]">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={() => openSendConfirm(product)}
                                  className="text-[10px]"
                                  title="Enviar teste para WhatsApp (ação explícita)"
                                >
                                  <Send className="w-3 h-3" />
                                  Enviar teste
                                </Button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedProduct(product)}
                                  className="text-[10px] text-[#00C2FF] hover:text-[#33D1FF] transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  Ver
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E9BAE]">
                    Ignorados
                  </span>
                  <Badge variant="neutral" size="xs">
                    {ignoredCount} ignorados
                  </Badge>
                </div>
                {!runResult || ignoredCount === 0 ? (
                  <p className="text-xs text-[#64748B] py-2">
                    {runResult
                      ? 'Nenhuma oferta ignorada nesta execução.'
                      : 'Sem execuções ainda.'}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {ignoredProducts.map((product) => (
                      <div
                        key={`${product.itemId}-${product.productLink}`}
                        className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-[#080E1C] border border-[#14203B]"
                      >
                        <XCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-[11px] text-[#94A3B8] block truncate">
                            {product.productName}
                          </span>
                          <span className="text-[10px] text-amber-400/90 block mt-0.5">
                            {product.rejectReason || 'Não passou nos filtros.'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===== Coluna auxiliar ===== */}
        <div className="lg:col-span-4 space-y-5">
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-[#00C2FF]" />
                  Dicas importantes
                </span>
              }
            />
            <CardContent className="space-y-2.5">
              {[
                'Os grupos são sincronizados apenas de contas WhatsApp conectadas.',
                'Os destinos vêm exclusivamente de /api/affiliate/auto-search/destinations.',
                'Produtos, preços e descontos são dados reais do productOfferV2.',
                'O preview nunca envia mensagens ao WhatsApp nesta etapa.',
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/80 shrink-0 mt-0.5" />
                  <span className="text-[11px] text-[#94A3B8] leading-relaxed">{tip}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Variáveis disponíveis" />
            <CardContent className="space-y-1.5">
              {TEMPLATE_VARIABLES.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#080E1C] border border-[#14203B]"
                >
                  <code className="text-[10px] font-mono text-[#00C2FF]">{item.key}</code>
                  <span className="text-[10px] text-[#8E9BAE] text-right">{item.desc}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#00C2FF]" />
                  Limite da execução
                </span>
              }
            />
            <CardContent>
              <div className="p-3 rounded-xl bg-[#0B1324] border border-[#162340] space-y-2">
                <div className="flex items-end justify-between">
                  <span className="text-[11px] text-[#8E9BAE]">Máx. por consulta</span>
                  <span className="text-2xl font-bold font-mono-numeric text-[#00C2FF]">
                    {draft.maxResults}
                    <span className="text-sm text-[#64748B]"> / 5</span>
                  </span>
                </div>
                <p className="text-[10px] text-[#64748B] leading-relaxed">
                  Limite real definido pela integração (productOfferV2). Ajuste na seção de filtros.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Status da integração" />
            <CardContent className="space-y-2">
              {sourceConfig ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-[#080E1C] border border-[#14203B] rounded-lg">
                    <span className="text-[10px] text-[#64748B] block">Configurada</span>
                    <span
                      className={`text-xs font-bold mt-0.5 block ${
                        sourceConfig.configured ? 'text-emerald-400' : 'text-[#8E9BAE]'
                      }`}
                    >
                      {sourceConfig.configured ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#080E1C] border border-[#14203B] rounded-lg">
                    <span className="text-[10px] text-[#64748B] block">Habilitada</span>
                    <span className="text-xs font-bold text-[#E6E8EC] mt-0.5 block">
                      {sourceConfig.enabled ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#080E1C] border border-[#14203B] rounded-lg">
                    <span className="text-[10px] text-[#64748B] block">Status</span>
                    <span className="text-xs font-bold text-[#E6E8EC] mt-0.5 block">
                      {sourceConfig.status}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#080E1C] border border-[#14203B] rounded-lg">
                    <span className="text-[10px] text-[#64748B] block">Sub IDs</span>
                    <span className="text-xs font-mono-numeric font-bold text-[#E6E8EC] mt-0.5 block">
                      {sourceConfig.subIds.join(', ') || '—'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#64748B]">Sem estado de integração disponível.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== Rodapé da tela ===== */}
      <div className="sticky bottom-0 z-30 -mx-2 px-2 py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-t border-[#162442] bg-[#0A0F1C]/95 backdrop-blur">
        <Button variant="ghost" size="md" onClick={onExit} className="text-xs justify-center">
          <ArrowLeft className="w-3.5 h-3.5" />
          Cancelar
        </Button>
        <div className="flex-1" />
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            loading={saving}
            disabled={!draft.name.trim()}
            className="text-xs justify-center"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar automação
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleRun}
            loading={running}
            className="text-xs justify-center"
          >
            <Play className="w-3.5 h-3.5" />
            Executar busca agora
          </Button>
        </div>
      </div>

      {/* ===== Drawer: template final do produto ===== */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setSelectedProduct(null)}
          />
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-[#070C18] border-l border-[#162340] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
            <div className="p-5 border-b border-[#14203B] bg-[#0A1020] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={selectedProduct.imageUrl}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover bg-[#14203B] shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-[#E6E8EC] truncate">
                    {selectedProduct.productName}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <MarketplaceBadge marketplace="Shopee" size="xs" />
                    <Badge variant="success" size="xs">
                      Qualificada
                    </Badge>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-lg text-[#8E9BAE] hover:text-[#E6E8EC] hover:bg-[#121E38] transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  ['Preço', formatBRL(selectedProduct.price)],
                  ['Preço original', formatBRL(selectedProduct.originalPrice)],
                  ['Desconto', `${selectedProduct.discountPercentage}%`],
                  ['Comissão', formatBRL(selectedProduct.commissionAmount)],
                  ['Vendas', formatSales(selectedProduct.sales)],
                  ['Avaliação', selectedProduct.rating != null ? `${selectedProduct.rating} ★` : '—'],
                  ['Vendedor', selectedProduct.shopName || '—'],
                  [
                    'Categorias (IDs reais)',
                    selectedProduct.categoryIds.length
                      ? selectedProduct.categoryIds.join(', ')
                      : '—',
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex flex-col gap-1 px-3 py-2.5 rounded-lg bg-[#080E1C] border border-[#14203B]"
                  >
                    <span className="text-[10px] text-[#8E9BAE]">{label}</span>
                    <span className="text-xs font-medium font-mono-numeric text-[#E6E8EC] break-words">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-[#0B1324] border border-[#162340] rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-[#00C2FF] shrink-0" />
                  <span className="text-xs font-semibold text-[#E6E8EC]">
                    Short link afiliado (real)
                  </span>
                </div>
                {selectedProduct.affiliateUrl ? (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-[11px] text-[#00C2FF] truncate">
                      {selectedProduct.affiliateUrl}
                    </span>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => void copyText(selectedProduct.affiliateUrl as string)}
                    >
                      <Copy className="w-3 h-3" />
                      Copiar
                    </Button>
                  </div>
                ) : (
                  <span className="text-[11px] text-amber-400 block">
                    {selectedProduct.linkError || 'Sem short link nesta execução.'}
                  </span>
                )}
                <a
                  href={selectedProduct.productLink || selectedProduct.offerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-[#8E9BAE] hover:text-[#E6E8EC] transition-colors"
                >
                  Abrir produto na Shopee
                  <ChevronRight className="w-3 h-3" />
                </a>
              </div>

              <div className="p-3 bg-[#0B1324] border border-[#162340] rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#00C2FF] shrink-0" />
                  <span className="text-xs font-semibold text-[#E6E8EC]">Template final</span>
                </div>
                <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-[#94A3B8] font-sans">
                  {draft.messageTemplate
                    ? fillTemplate(draft.messageTemplate, selectedProduct)
                    : 'Sem template configurado.'}
                </pre>
                {selectedProduct.imageUrl && (
                  <img
                    src={selectedProduct.imageUrl}
                    alt=""
                    className="w-full h-auto max-h-44 object-contain rounded-lg bg-[#080E1C] border border-[#14203B]"
                  />
                )}
              </div>
              <p className="text-[10px] text-[#64748B]">
                Preview do template. Para enviar ao WhatsApp use “Enviar teste” na
                tabela de aprovados (ação explícita e manual).
              </p>
            </div>
            <div className="p-4 border-t border-[#14203B] bg-[#0A1020] flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProduct(null)}
                className="flex-1 text-xs"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal: confirmação de envio real para WhatsApp ===== */}
      {sendTarget && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => {
              if (!sending) setSendTarget(null);
            }}
          />
          <div className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[#070C18] border border-[#1E3563] rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#14203B] bg-[#0A1020] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#1E5EFF]/15 border border-[#1E3563]">
                  <Send className="w-4 h-4 text-[#00C2FF]" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-[#E6E8EC] truncate">
                    Enviar teste para WhatsApp
                  </h2>
                  <span className="text-[10px] text-[#64748B] block mt-0.5">
                    Somente após sua confirmação · 1 produto · 1 grupo · 1 conta
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSendTarget(null)}
                disabled={sending}
                className="p-1.5 rounded-lg text-[#8E9BAE] hover:text-[#E6E8EC] hover:bg-[#121E38] transition-colors disabled:opacity-40"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {sendResult && sendResult.status === 'sent' ? (
              <div className="p-5 space-y-4">
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <p className="text-sm font-semibold text-[#E6E8EC]">
                    Teste enviado com sucesso.
                  </p>
                  <p className="text-[11px] text-[#8E9BAE]">
                    A mensagem foi entregue ao grupo pelo WhatsApp real.
                  </p>
                </div>
                {[
                  ['Conta WhatsApp', selectedAccount?.name || sendTarget.automationId],
                  [
                    'Grupo',
                    targetGroups.find((group) => group.id === sendTarget.groupId)?.name ||
                      sendTarget.groupId,
                  ],
                  ['Message ID', sendResult.messageId || '—'],
                  ['Data de envio', new Date(sendResult.sentAt).toLocaleString('pt-BR')],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-3 px-3 py-2.5 rounded-lg bg-[#080E1C] border border-[#14203B]"
                  >
                    <span className="text-[10px] text-[#8E9BAE]">{label}</span>
                    <span className="text-[11px] font-medium text-[#E6E8EC] break-words text-right">
                      {value}
                    </span>
                  </div>
                ))}
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setSendTarget(null)}
                  className="w-full text-xs justify-center"
                >
                  Fechar
                </Button>
              </div>
            ) : sendResult && sendResult.status === 'failed' ? (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3 py-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#E6E8EC]">Falha no envio.</p>
                    <p className="text-[11px] text-[#94A3B8] mt-1 break-words">
                      {sendResult.error || 'Erro sanitizado do servidor.'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setSendResult(null);
                      setSendError(null);
                    }}
                    className="flex-1 text-xs justify-center"
                  >
                    Tentar novamente
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setSendTarget(null)}
                    className="flex-1 text-xs justify-center"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[11px] text-[#8E9BAE] block mb-1">
                    Conta WhatsApp (salva na automação)
                  </label>
                  <span className="text-xs font-medium text-[#E6E8EC] block px-3 py-2.5 rounded-lg bg-[#080E1C] border border-[#14203B]">
                    {selectedAccount?.name || sendTarget.automationId}
                  </span>
                </div>
                <div>
                  <label className="text-[11px] text-[#8E9BAE] block mb-1">
                    Grupo de destino (grupo real)
                  </label>
                  <Select
                    value={sendTarget.groupId}
                    disabled={sending}
                    options={targetGroups.map((group) => ({
                      value: group.id,
                      label: group.name,
                    }))}
                    onChange={(e) =>
                      setSendTarget((prev) => (prev ? { ...prev, groupId: e.target.value } : prev))
                    }
                  />
                </div>

                <div className="p-3 bg-[#0B1324] border border-[#162340] rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#E6E8EC] truncate">
                      {sendTarget.product.productName}
                    </span>
                    <Badge variant="success" size="xs">
                      {sendTarget.product.discountPercentage}% OFF
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-[#8E9BAE]">
                      {formatBRL(sendTarget.product.price)}{' '}
                      <span className="line-through text-[#64748B]">
                        {formatBRL(sendTarget.product.originalPrice)}
                      </span>
                    </span>
                    <span className="text-[10px] text-[#00C2FF] truncate max-w-[180px]">
                      {sendTarget.product.affiliateUrl}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#080E1C] border border-[#14203B] rounded-xl space-y-1.5">
                  <span className="text-[11px] font-semibold text-[#E6E8EC] block">
                    Mensagem que será enviada
                  </span>
                  <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-[#94A3B8] font-sans">
                    {draft.messageTemplate
                      ? fillTemplate(draft.messageTemplate, sendTarget.product)
                      : 'Sem template configurado.'}
                  </pre>
                </div>

                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#1E5EFF]/10 border border-[#1E3563]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00C2FF] shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-relaxed text-[#8E9BAE]">
                    Nada é enviado até você clicar em <b className="text-[#E6E8EC]">Enviar agora</b>.
                    O produto, o preço, o desconto e o short link vêm direto da Shopee (real).
                  </p>
                </div>

                {sendError && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-relaxed text-red-300 break-words">
                      {sendError}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setSendTarget(null)}
                    disabled={sending}
                    className="flex-1 text-xs justify-center"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => void handleConfirmSend()}
                    loading={sending}
                    disabled={!sendTarget.groupId}
                    className="flex-1 text-xs justify-center"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar agora
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] bg-[#0E172C] border border-[#1E3563] text-[#E6E8EC] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-[#00C2FF] shrink-0" />
          )}
          <span className="font-medium leading-relaxed">{toast.text}</span>
        </div>
      )}
    </div>
  );
};