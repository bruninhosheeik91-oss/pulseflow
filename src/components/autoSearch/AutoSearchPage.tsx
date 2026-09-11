import React, { useState, useCallback } from 'react';
import {
  Play,
  Pause,
  Search,
  ChevronDown,
  ChevronRight,
  Settings,
  Target,
  Zap,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Select } from '../ui/Select';
import { MarketplaceBadge } from '../ui/MarketplaceBadge';
import { Status } from '../ui/Status';
import {
  AutoSearchMarketplaceSource,
  AutoSearchCriteria,
  AutoSearchScoreWeights,
  AutoSearchSchedule,
  AutoSearchDestination,
  AutoSearchDeduplication,
  AutoSearchResultItem,
  AutoSearchActivityLogEntry,
  AutoSearchLastSearch,
  AutoSearchEngineStatus,
  AutoSearchFrequency,
  AutoSearchApprovalMode,
  ALL_AUTO_SEARCH_CATEGORIES,
  FREQUENCY_OPTIONS,
  DAY_OPTIONS,
} from '../../types/autoSearch';
import {
  initialAutoSearchSources,
  initialAutoSearchCriteria,
  initialAutoSearchScoreWeights,
  initialAutoSearchSchedule,
  initialAutoSearchDestination,
  initialAutoSearchDeduplication,
  initialAutoSearchResults,
  initialAutoSearchActivityLog,
  initialAutoSearchLastSearch,
  initialAutoSearchEngineStatus,
} from '../../data/mockAutoSearch';
import { initialCampaigns } from '../../data/mockCampaigns';

export const AutoSearchPage: React.FC = () => {
  const [sources, setSources] = useState<AutoSearchMarketplaceSource[]>(initialAutoSearchSources);
  const [criteria, setCriteria] = useState<AutoSearchCriteria>(initialAutoSearchCriteria);
  const [scoreWeights, setScoreWeights] = useState<AutoSearchScoreWeights>(initialAutoSearchScoreWeights);
  const [schedule, setSchedule] = useState<AutoSearchSchedule>(initialAutoSearchSchedule);
  const [destination, setDestination] = useState<AutoSearchDestination>(initialAutoSearchDestination);
  const [deduplication, setDeduplication] = useState<AutoSearchDeduplication>(initialAutoSearchDeduplication);
  const [results, setResults] = useState<AutoSearchResultItem[]>(initialAutoSearchResults);
  const [activityLog, setActivityLog] = useState<AutoSearchActivityLogEntry[]>(initialAutoSearchActivityLog);
  const [lastSearch, setLastSearch] = useState<AutoSearchLastSearch>(initialAutoSearchLastSearch);
  const [engineStatus, setEngineStatus] = useState<AutoSearchEngineStatus>(initialAutoSearchEngineStatus);
  const [approvalMode, setApprovalMode] = useState<AutoSearchApprovalMode>('manual');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSource, setSelectedSource] = useState<AutoSearchMarketplaceSource | null>(null);
  const [selectedResult, setSelectedResult] = useState<AutoSearchResultItem | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    advancedRules: false,
    scoreWeights: false,
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Todas']);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSearchNow = () => {
    setIsSearching(true);
    const newTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setTimeout(() => {
      setIsSearching(false);
      setEngineStatus((prev) => ({
        ...prev,
        lastExecution: newTime,
      }));
      setLastSearch((prev) => ({ ...prev, time: newTime }));
      setActivityLog((prev) => [
        {
          id: `AL-NOW-${Date.now()}`,
          time: `${newTime}:08`,
          message: 'Busca executada. Resultados em análise.',
          type: 'success',
        },
        ...prev,
      ]);
      showToast('Busca executada.');
    }, 2500);
  };

  const handleToggleEngine = () => {
    const newStatus = engineStatus.status === 'active' ? 'paused' : 'active';
    setEngineStatus((prev) => ({ ...prev, status: newStatus }));
    showToast(
      newStatus === 'active'
        ? 'Motor de busca retomado.'
        : 'Busca automática pausada.',
      'info'
    );
  };

  const handleToggleCategory = (cat: string) => {
    if (cat === 'Todas') {
      setSelectedCategories(['Todas']);
      return;
    }
    setSelectedCategories((prev) => {
      const without = prev.filter((c) => c !== 'Todas' && c !== cat);
      if (prev.includes(cat)) return without.length === 0 ? ['Todas'] : without;
      return [...without, cat];
    });
  };

  const scoreWeightsTotal = scoreWeights.discount + scoreWeights.rating + scoreWeights.sales + scoreWeights.commission + scoreWeights.price + scoreWeights.coupon;
  const scoreWeightsValid = scoreWeightsTotal === 100;

  const activeSourcesCount = sources.filter((s) => s.status === 'active').length;
  const totalResults = results.length;
  const qualifiedCount = results.filter((r) => r.status === 'qualified').length;
  const ignoredCount = results.filter((r) => r.status === 'ignored').length;
  const duplicateCount = results.filter((r) => r.status === 'duplicate').length;

  const handleScoreWeightChange = (key: keyof AutoSearchScoreWeights, value: number) => {
    setScoreWeights((prev) => ({ ...prev, [key]: Math.max(0, Math.min(100, value)) }));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#E6E8EC] tracking-tight">
              Busca Automática
            </h1>
            <Status
              variant={engineStatus.status === 'active' ? 'active' : 'idle'}
              size="sm"
              label={engineStatus.status === 'active' ? 'Ativa' : 'Pausada'}
            />
          </div>
          <p className="text-xs text-[#8E9BAE] mt-1">
            Encontre e selecione automaticamente as melhores ofertas dos marketplaces conectados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleEngine}
            className="text-xs"
          >
            {engineStatus.status === 'active' ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                Pausar busca
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Retomar busca
              </>
            )}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSearchNow}
            loading={isSearching}
            className="text-xs"
          >
            <Search className="w-3.5 h-3.5" />
            Buscar agora
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-5 space-y-5">
          {/* Engine Status Card */}
          <Card>
            <CardHeader
              title="Motor de Busca"
              subtitle="Status operacional do motor de varredura"
              action={
                <Button variant="ghost" size="icon">
                  <Settings className="w-4 h-4 text-[#64748B]" />
                </Button>
              }
            />
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  ['Status', engineStatus.status === 'active' ? 'Ativo' : 'Pausado', engineStatus.status === 'active' ? 'text-emerald-400' : 'text-amber-400'],
                  ['Última execução', engineStatus.lastExecution, 'text-[#E6E8EC]'],
                  ['Duração', engineStatus.duration, 'text-[#E6E8EC]'],
                  ['Produtos analisados', String(engineStatus.productsAnalyzed), 'text-[#00C2FF]'],
                  ['Ofertas qualificadas', String(engineStatus.qualifiedOffers), 'text-emerald-400'],
                  ['Próxima execução', engineStatus.nextExecution, 'text-[#E6E8EC]'],
                  ['Frequência', engineStatus.frequencyLabel, 'text-[#E6E8EC]'],
                  ['Fontes configuradas', String(engineStatus.configuredSources), 'text-[#8E9BAE]'],
                ].map(([label, value, color]) => (
                  <div key={label} className="p-2.5 bg-[#080E1C] border border-[#14203B] rounded-lg">
                    <span className="text-[10px] text-[#64748B] block">{label}</span>
                    <span className={`text-xs font-bold font-mono-numeric ${color} mt-0.5 block`}>{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* No Sources State */}
          {activeSourcesCount === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 bg-[#0E1628] border border-[#1B2947] rounded-xl">
              <div className="w-12 h-12 rounded-2xl bg-[#14203B] border border-[#1E3057] flex items-center justify-center">
                <Search className="w-5 h-5 text-[#64748B]" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-[#E6E8EC]">Nenhuma fonte configurada</p>
                <p className="text-xs text-[#8E9BAE] max-w-xs">
                  Configure pelo menos um marketplace para utilizar a Busca Automática.
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={() => setSelectedSource(sources[0] || null)} className="text-xs">
                <Settings className="w-3.5 h-3.5" />
                Configurar fontes
              </Button>
            </div>
          )}

          {/* Marketplace Sources */}
          <Card>
            <CardHeader
              title="Fontes da busca"
              subtitle="Marketplaces conectados ao motor de varredura"
              action={
                <Badge variant="info" size="xs">
                  {activeSourcesCount} ativas
                </Badge>
              }
            />
            <CardContent className="space-y-2">
              {sources.map((src) => (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => setSelectedSource(src)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#080E1C] border border-[#14203B] hover:border-[#1E3057] transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MarketplaceBadge marketplace={src.marketplace} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#E6E8EC]">{src.label}</span>
                      </div>
                      <span className="text-[10px] text-[#64748B]">
                        {src.status === 'active' ? `Ativo · ${src.lastSync}` :
                         src.status === 'paused' ? 'Pausado' :
                         src.status === 'not_configured' ? 'Não configurado' : 'Indisponível'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        src.status === 'active' ? 'bg-emerald-500' :
                        src.status === 'paused' ? 'bg-amber-500' :
                        src.status === 'not_configured' ? 'bg-[#374151]' : 'bg-red-500'
                      }`}
                    />
                    <ChevronRight className="w-3.5 h-3.5 text-[#4B5563]" />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader
              title="Categorias monitoradas"
              subtitle="Filtre por categorias específicas de produto"
            />
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {ALL_AUTO_SEARCH_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleToggleCategory(cat)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border cursor-pointer ${
                        isSelected
                          ? 'bg-[#1E5EFF]/15 text-[#00C2FF] border-[#1E5EFF]/40'
                          : 'bg-[#0A1020] text-[#8E9BAE] border-[#1C2C50] hover:border-[#2A4072] hover:text-[#E6E8EC]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Qualification Criteria */}
          <Card>
            <CardHeader
              title="Critérios da Oferta"
              subtitle="Somente ofertas que atenderem aos critérios abaixo poderão avançar."
            />
            <CardContent className="space-y-2.5">
              {[
                { label: 'Deal Score mínimo', value: criteria.minDealScore, suffix: 'pts', key: 'minDealScore' as const },
                { label: 'Desconto mínimo', value: criteria.minDiscount, suffix: '%', key: 'minDiscount' as const },
                { label: 'Avaliação mínima', value: criteria.minRating, suffix: '★', key: 'minRating' as const },
                { label: 'Vendas mínimas', value: criteria.minSales, suffix: '', key: 'minSales' as const },
                { label: 'Comissão mínima', value: criteria.minCommission, suffix: 'R$', key: 'minCommission' as const },
                { label: 'Preço mínimo', value: criteria.minPrice, suffix: 'R$', key: 'minPrice' as const },
                { label: 'Preço máximo', value: criteria.maxPrice, suffix: 'R$', key: 'maxPrice' as const },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#080E1C] border border-[#14203B]">
                  <span className="text-xs text-[#94A3B8]">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    {item.suffix === 'R$' && <span className="text-[10px] text-[#64748B]">R$</span>}
                    <input
                      type="number"
                      value={item.value}
                      onChange={(e) =>
                        setCriteria((prev) => ({
                          ...prev,
                          [item.key]: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-20 h-7 text-right text-xs font-mono-numeric font-bold text-[#E6E8EC] bg-[#0A1020] border border-[#1B2947] rounded-md px-2 focus:outline-none focus:border-[#1E5EFF] focus:ring-1 focus:ring-[#1E5EFF]"
                    />
                    {item.suffix && item.suffix !== 'R$' && (
                      <span className="text-[10px] text-[#64748B]">{item.suffix}</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Score Weights */}
          <Card>
            <CardHeader
              title="Deal Score"
              subtitle="O DOMNEX utiliza vários sinais para classificar o potencial de cada oferta."
              action={
                <button
                  type="button"
                  onClick={() => toggleSection('scoreWeights')}
                  className="flex items-center gap-1 text-[11px] text-[#8E9BAE] hover:text-[#E6E8EC] transition-colors"
                >
                  {expandedSections.scoreWeights ? 'Ocultar' : 'Configurar pesos'}
                  <ChevronDown className={`w-3 h-3 transition-transform ${expandedSections.scoreWeights ? 'rotate-180' : ''}`} />
                </button>
              }
            />
            <CardContent className="space-y-2.5">
              {[
                { label: 'Desconto', key: 'discount' as const, color: 'bg-[#00C2FF]' },
                { label: 'Avaliação', key: 'rating' as const, color: 'bg-emerald-400' },
                { label: 'Vendas', key: 'sales' as const, color: 'bg-amber-400' },
                { label: 'Comissão', key: 'commission' as const, color: 'bg-[#38BDF8]' },
                { label: 'Preço', key: 'price' as const, color: 'bg-purple-400' },
                { label: 'Cupom/benefício', key: 'coupon' as const, color: 'bg-rose-400' },
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <span className="text-xs text-[#94A3B8] w-28 shrink-0">{item.label}</span>
                  <div className="flex-1 h-2 bg-[#14203B] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${scoreWeights[item.key]}%` }}
                    />
                  </div>
                  {expandedSections.scoreWeights ? (
                    <input
                      type="number"
                      value={scoreWeights[item.key]}
                      onChange={(e) => handleScoreWeightChange(item.key, parseInt(e.target.value) || 0)}
                      className="w-14 h-6 text-center text-[11px] font-mono-numeric font-bold text-[#E6E8EC] bg-[#0A1020] border border-[#1B2947] rounded px-1 focus:outline-none focus:border-[#1E5EFF]"
                    />
                  ) : (
                    <span className="text-xs font-mono-numeric font-bold text-[#E6E8EC] w-14 text-right">
                      {scoreWeights[item.key]} pts
                    </span>
                  )}
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-[#14203B]">
                <span className="text-xs font-semibold text-[#8E9BAE]">Total</span>
                <span className={`text-sm font-bold font-mono-numeric ${scoreWeightsValid ? 'text-emerald-400' : 'text-red-400'}`}>
                  {scoreWeightsTotal}
                </span>
              </div>
              {!scoreWeightsValid && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="text-[11px] text-red-400">Os pesos precisam totalizar 100 pontos.</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader
              title="Frequência"
              subtitle="Configure a periodicidade da busca automática"
            />
            <CardContent className="space-y-4">
              <div>
                <label className="text-[11px] text-[#8E9BAE] block mb-1.5">Executar busca a cada:</label>
                <Select
                  options={FREQUENCY_OPTIONS}
                  value={schedule.frequency}
                  onChange={(e) =>
                    setSchedule((prev) => ({ ...prev, frequency: e.target.value as AutoSearchFrequency }))
                  }
                />
              </div>
              <div>
                <label className="text-[11px] text-[#8E9BAE] block mb-1.5">Horário operacional</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#64748B]">Das</span>
                    <input
                      type="time"
                      value={schedule.timeStart}
                      onChange={(e) => setSchedule((prev) => ({ ...prev, timeStart: e.target.value }))}
                      className="h-7 text-xs font-mono-numeric text-[#E6E8EC] bg-[#0A1020] border border-[#1B2947] rounded-md px-2 focus:outline-none focus:border-[#1E5EFF]"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#64748B]">Até</span>
                    <input
                      type="time"
                      value={schedule.timeEnd}
                      onChange={(e) => setSchedule((prev) => ({ ...prev, timeEnd: e.target.value }))}
                      className="h-7 text-xs font-mono-numeric text-[#E6E8EC] bg-[#0A1020] border border-[#1B2947] rounded-md px-2 focus:outline-none focus:border-[#1E5EFF]"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-[#8E9BAE] block mb-1.5">Dias da semana</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAY_OPTIONS.map((day) => {
                    const isSelected = schedule.activeDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          setSchedule((prev) => ({
                            ...prev,
                            activeDays: isSelected
                              ? prev.activeDays.filter((d) => d !== day)
                              : [...prev.activeDays, day],
                          }))
                        }
                        className={`w-9 h-7 rounded-md text-[10px] font-semibold transition-colors border cursor-pointer ${
                          isSelected
                            ? 'bg-[#1E5EFF]/15 text-[#00C2FF] border-[#1E5EFF]/40'
                            : 'bg-[#0A1020] text-[#64748B] border-[#1C2C50] hover:border-[#2A4072]'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Destination */}
          <Card>
            <CardHeader
              title="Após encontrar uma boa oferta"
              subtitle="A Busca Automática NÃO publica diretamente. Ofertas seguem para processamento."
            />
            <CardContent className="space-y-3">
              {[
                { value: 'manual_review' as const, label: 'Enviar para análise manual', icon: Eye, desc: 'O usuário aprova cada oferta antes de avançar.' },
                { value: 'campaign' as const, label: 'Enviar para uma campanha', icon: Target, desc: 'Ofertas são encaminhadas para uma campanha configurada.' },
                { value: 'queue' as const, label: 'Enviar diretamente à fila', icon: Zap, desc: 'Ofertas vão direto para a fila de publicação.' },
              ].map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDestination((prev) => ({ ...prev, type: opt.value }))}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left cursor-pointer ${
                      destination.type === opt.value
                        ? 'bg-[#121E38] border-[#1E325C]'
                        : 'bg-[#080E1C] border-[#14203B] hover:border-[#1E3057]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      destination.type === opt.value
                        ? 'bg-[#1E5EFF]/15 border border-[#1E5EFF]/40'
                        : 'bg-[#14203B] border border-[#1E3057]'
                    }`}>
                      <Icon className={`w-4 h-4 ${destination.type === opt.value ? 'text-[#00C2FF]' : 'text-[#64748B]'}`} />
                    </div>
                    <div className="min-w-0">
                      <span className={`text-xs font-medium block ${destination.type === opt.value ? 'text-[#E6E8EC]' : 'text-[#94A3B8]'}`}>
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-[#64748B] mt-0.5 block">{opt.desc}</span>
                    </div>
                  </button>
                );
              })}

              {destination.type === 'campaign' && (
                <div className="pt-2">
                  <label className="text-[11px] text-[#8E9BAE] block mb-1.5">Campanha de destino</label>
                  <Select
                    options={initialCampaigns.map((c) => ({ value: c.id, label: c.name }))}
                    value={destination.campaignId || ''}
                    onChange={(e) => {
                      const camp = initialCampaigns.find((c) => c.id === e.target.value);
                      setDestination((prev) => ({
                        ...prev,
                        campaignId: e.target.value,
                        campaignName: camp?.name || '',
                      }));
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval Mode */}
          <Card>
            <CardHeader title="Aprovação" subtitle="Como ofertas qualificadas são processadas" />
            <CardContent className="space-y-3">
              {[
                { value: 'manual' as const, label: 'Manual', desc: 'O usuário precisa aprovar as ofertas individualmente.' },
                { value: 'automatic' as const, label: 'Automática', desc: 'Ofertas elegíveis seguem automaticamente para o destino configurado.' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setApprovalMode(opt.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left cursor-pointer ${
                    approvalMode === opt.value
                      ? 'bg-[#121E38] border-[#1E325C]'
                      : 'bg-[#080E1C] border-[#14203B] hover:border-[#1E3057]'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    approvalMode === opt.value
                      ? 'border-[#00C2FF] bg-[#00C2FF]/20'
                      : 'border-[#374151]'
                  }`}>
                    {approvalMode === opt.value && (
                      <div className="w-2 h-2 rounded-full bg-[#00C2FF]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className={`text-xs font-medium block ${approvalMode === opt.value ? 'text-[#E6E8EC]' : 'text-[#94A3B8]'}`}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-[#64748B] mt-0.5 block">{opt.desc}</span>
                  </div>
                </button>
              ))}
              {approvalMode === 'automatic' && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#0E2030] border border-[#1C3A4E]">
                  <Info className="w-3.5 h-3.5 text-[#00C2FF] shrink-0 mt-0.5" />
                  <span className="text-[11px] text-[#94A3B8] leading-relaxed">
                    As regras de qualificação serão utilizadas para decidir quais ofertas podem avançar.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deduplication */}
          <Card>
            <CardHeader title="Proteção contra duplicidade" subtitle="Evite repetir produtos e ofertas já processados" />
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-[#080E1C] border border-[#14203B] rounded-lg">
                  <span className="text-[10px] text-[#64748B] block">Não repetir o mesmo produto por</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="number"
                      value={deduplication.productRepeatDays}
                      onChange={(e) =>
                        setDeduplication((prev) => ({ ...prev, productRepeatDays: parseInt(e.target.value) || 1 }))
                      }
                      className="w-14 h-7 text-center text-xs font-mono-numeric font-bold text-[#E6E8EC] bg-[#0A1020] border border-[#1B2947] rounded-md focus:outline-none focus:border-[#1E5EFF]"
                    />
                    <span className="text-[10px] text-[#64748B]">dias</span>
                  </div>
                </div>
                <div className="p-2.5 bg-[#080E1C] border border-[#14203B] rounded-lg">
                  <span className="text-[10px] text-[#64748B] block">Não repetir a mesma oferta por</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="number"
                      value={deduplication.offerRepeatDays}
                      onChange={(e) =>
                        setDeduplication((prev) => ({ ...prev, offerRepeatDays: parseInt(e.target.value) || 1 }))
                      }
                      className="w-14 h-7 text-center text-xs font-mono-numeric font-bold text-[#E6E8EC] bg-[#0A1020] border border-[#1B2947] rounded-md focus:outline-none focus:border-[#1E5EFF]"
                    />
                    <span className="text-[10px] text-[#64748B]">dias</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-[#8E9BAE] block mb-1.5">Se produto já estiver na fila:</label>
                <div className="space-y-1.5">
                  {[
                    { value: 'keep_best_score' as const, label: 'Manter a oferta de maior Deal Score' },
                    { value: 'keep_lowest_price' as const, label: 'Manter a de menor preço' },
                    { value: 'keep_both' as const, label: 'Manter ambas' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDeduplication((prev) => ({ ...prev, duplicatePolicy: opt.value }))}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#080E1C] border border-[#14203B] text-left cursor-pointer"
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        deduplication.duplicatePolicy === opt.value
                          ? 'border-[#00C2FF] bg-[#00C2FF]/20'
                          : 'border-[#374151]'
                      }`}>
                        {deduplication.duplicatePolicy === opt.value && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#00C2FF]" />
                        )}
                      </div>
                      <span className={`text-xs ${deduplication.duplicatePolicy === opt.value ? 'text-[#E6E8EC]' : 'text-[#94A3B8]'}`}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Rules */}
          <Card>
            <button
              type="button"
              onClick={() => toggleSection('advancedRules')}
              className="w-full flex items-center justify-between p-5 cursor-pointer"
            >
              <div>
                <h3 className="text-sm font-semibold text-[#E6E8EC] tracking-tight text-left">
                  Regras avançadas
                </h3>
                <p className="text-xs text-[#8E9BAE] mt-0.5 text-left">
                  Configurações adicionais de filtragem
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${expandedSections.advancedRules ? 'rotate-180' : ''}`} />
            </button>
            {expandedSections.advancedRules && (
              <CardContent className="pt-0 space-y-2">
                {[
                  { label: 'Priorizar lojas oficiais', defaultChecked: true },
                  { label: 'Ignorar ofertas duplicadas', defaultChecked: true },
                  { label: 'Ignorar produtos publicados recentemente', defaultChecked: true },
                  { label: 'Ignorar oferta sem avaliação', defaultChecked: true },
                  { label: 'Exigir cupom', defaultChecked: false },
                  { label: 'Exigir frete grátis', defaultChecked: false },
                  { label: 'Ignorar oferta sem comissão conhecida', defaultChecked: true },
                ].map((rule) => {
                  const [checked, setChecked] = useState(rule.defaultChecked);
                  return (
                    <label
                      key={rule.label}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#080E1C] border border-[#14203B] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setChecked(!checked)}
                        className="w-4 h-4 rounded border-[#374151] bg-[#0A1020] text-[#1E5EFF] focus:ring-[#1E5EFF] focus:ring-offset-0 cursor-pointer"
                      />
                      <span className={`text-xs ${checked ? 'text-[#E6E8EC]' : 'text-[#8E9BAE]'}`}>
                        {rule.label}
                      </span>
                    </label>
                  );
                })}
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right Column - Results & Activity */}
        <div className="lg:col-span-7 space-y-5">
          {/* Last Search Summary */}
          <Card>
            <CardHeader
              title="Última busca"
              subtitle={`Executada às ${lastSearch.time}`}
              action={
                <Button variant="ghost" size="xs" onClick={handleSearchNow} loading={isSearching}>
                  <RefreshCw className="w-3 h-3" />
                  Executar nova busca
                </Button>
              }
            />
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  ['Marketplaces consultados', String(lastSearch.marketplacesConsulted)],
                  ['Produtos analisados', String(lastSearch.productsAnalyzed)],
                  ['Ofertas encontradas', String(lastSearch.offersFound)],
                  ['Qualificadas', String(lastSearch.qualified)],
                  ['Ignoradas', String(lastSearch.ignored)],
                  ['Duplicadas', String(lastSearch.duplicates)],
                  ['Enviadas à campanha', String(lastSearch.sentToCampaign)],
                  ['Horário', lastSearch.time],
                ].map(([label, value]) => (
                  <div key={label} className="p-2.5 bg-[#080E1C] border border-[#14203B] rounded-lg">
                    <span className="text-[10px] text-[#64748B] block">{label}</span>
                    <span className="text-sm font-bold font-mono-numeric text-[#E6E8EC] mt-0.5 block">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
          <Card>
            <CardHeader
              title="Resultados da última busca"
              subtitle={`${qualifiedCount} qualificadas · ${ignoredCount} ignoradas · ${duplicateCount} duplicadas`}
              action={
                <div className="flex items-center gap-1.5">
                  <Badge variant="success" size="xs">{qualifiedCount} qualificadas</Badge>
                  <Badge variant="neutral" size="xs">{ignoredCount} ignoradas</Badge>
                </div>
              }
            />
            <CardContent className="p-0">
              {qualifiedCount === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10">
                  <div className="w-12 h-12 rounded-2xl bg-[#14203B] border border-[#1E3057] flex items-center justify-center">
                    <Search className="w-5 h-5 text-[#64748B]" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-[#E6E8EC]">Nenhuma oferta qualificada</p>
                    <p className="text-xs text-[#8E9BAE] max-w-md mx-auto">
                      A busca foi concluída, mas nenhuma oferta atendeu aos critérios atuais.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-xs">
                      Revisar critérios
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSearchNow} loading={isSearching} className="text-xs">
                      <Search className="w-3.5 h-3.5" />
                      Executar nova busca
                    </Button>
                  </div>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#162442]">
                      {['Produto', 'Marketplace', 'Preço', 'Desconto', 'Comissão', 'Score', 'Resultado', 'Destino', 'Ação'].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-[#64748B] uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((item) => (
                      <tr key={item.id} className="border-b border-[#14203B] last:border-0 hover:bg-[#0A1020] transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={item.productImage}
                              alt=""
                              className="w-8 h-8 rounded-md object-cover bg-[#14203B] shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="text-[11px] font-medium text-[#E6E8EC] block truncate max-w-[200px]">
                                {item.productName}
                              </span>
                              {item.rejectReason && (
                                <span className="text-[10px] text-amber-400">{item.rejectReason}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <MarketplaceBadge marketplace={item.marketplace} size="xs" />
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-[11px] font-mono-numeric font-bold text-[#E6E8EC]">
                            R$ {item.price.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant={item.discountPercentage >= 40 ? 'success' : item.discountPercentage >= 25 ? 'info' : 'neutral'} size="xs">
                            {item.discountPercentage}%
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-[11px] font-mono-numeric text-[#E6E8EC]">
                            R$ {item.commissionAmount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant={item.score >= 90 ? 'score-excellent' : item.score >= 80 ? 'score-great' : 'score-good'}
                            size="xs"
                          >
                            {item.score}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant={
                              item.status === 'qualified' ? 'success' :
                              item.status === 'ignored' ? 'neutral' : 'warning'
                            }
                            size="xs"
                          >
                            {item.status === 'qualified' ? 'Qualificada' :
                             item.status === 'ignored' ? 'Ignorada' : 'Duplicada'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-[11px] text-[#94A3B8]">{item.destination}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => setSelectedResult(item)}
                            className="text-[10px] text-[#00C2FF] hover:text-[#33D1FF] transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader
              title="Atividade da Busca"
              subtitle="Registro das últimas execuções do motor"
            />
            <CardContent className="space-y-2">
              {activityLog.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 bg-[#080E1C] border border-[#14203B] rounded-lg">
                  <RefreshCw className="w-6 h-6 text-[#475569]" />
                  <p className="text-xs text-[#8E9BAE]">
                    Nenhuma execução registrada ainda.
                  </p>
                </div>
              ) : activityLog.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 px-3 py-2 rounded-lg bg-[#080E1C] border border-[#14203B]"
                >
                  <span className={`text-[10px] font-mono-numeric font-semibold px-2 py-0.5 rounded shrink-0 mt-0.5 ${
                    entry.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                      : entry.type === 'marketplace'
                      ? 'bg-[#1E5EFF]/10 text-[#00C2FF] border border-[#1E5EFF]/25'
                      : entry.type === 'warning'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                      : 'bg-[#131F38] text-[#8E9BAE] border border-[#1C2C50]'
                  }`}>
                    {entry.time}
                  </span>
                  <span className="text-[11px] text-[#94A3B8] leading-relaxed">{entry.message}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Marketplace Source Drawer */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setSelectedSource(null)}
          />
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-[#070C18] border-l border-[#162340] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
            <div className="p-5 border-b border-[#14203B] bg-[#0A1020] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <MarketplaceBadge marketplace={selectedSource.marketplace} size="md" />
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#E6E8EC]">{selectedSource.label}</h2>
                  <p className="text-[11px] text-[#8E9BAE] mt-0.5">Configuração da fonte de busca</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSource(null)}
                className="p-1.5 rounded-lg text-[#8E9BAE] hover:text-[#E6E8EC] hover:bg-[#121E38] transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="space-y-2.5">
                {[
                  ['Status da fonte', selectedSource.status === 'active' ? 'Ativa' : selectedSource.status === 'paused' ? 'Pausada' : 'Não configurada'],
                  ['Buscar automaticamente', selectedSource.autoSearch ? 'Sim' : 'Não'],
                  ['Categorias', selectedSource.categories.join(', ') || 'Nenhuma'],
                  ['Prioridade', selectedSource.priority],
                  ['Última sincronização', selectedSource.lastSync],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#080E1C] border border-[#14203B]">
                    <span className="text-[11px] text-[#8E9BAE]">{label}</span>
                    <span className="text-xs font-medium text-[#E6E8EC]">{value}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-[#0E2030] border border-[#1C3A4E] rounded-lg flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-semibold text-amber-300 block">Integração real: Não configurada</span>
                  <span className="text-[10px] text-[#94A3B8] mt-0.5 block">
                    Dados simulados para demonstração. Nenhuma leitura ou captura externa é realizada.
                  </span>
                  <Badge variant="warning" size="xs" className="mt-2">Mock</Badge>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[#14203B] bg-[#0A1020]">
              <Button variant="outline" size="sm" onClick={() => setSelectedSource(null)} className="w-full text-xs">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Result Inspection Drawer */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setSelectedResult(null)}
          />
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-[#070C18] border-l border-[#162340] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
            <div className="p-5 border-b border-[#14203B] bg-[#0A1020] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={selectedResult.productImage}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover bg-[#14203B] shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-[#E6E8EC] truncate">{selectedResult.productName}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <MarketplaceBadge marketplace={selectedResult.marketplace} size="xs" />
                    <Badge
                      variant={
                        selectedResult.status === 'qualified' ? 'success' :
                        selectedResult.status === 'ignored' ? 'neutral' : 'warning'
                      }
                      size="xs"
                    >
                      {selectedResult.status === 'qualified' ? 'Qualificada' :
                       selectedResult.status === 'ignored' ? 'Ignorada' : 'Duplicada'}
                    </Badge>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResult(null)}
                className="p-1.5 rounded-lg text-[#8E9BAE] hover:text-[#E6E8EC] hover:bg-[#121E38] transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="space-y-2.5">
                {[
                  ['Preço', `R$ ${selectedResult.price.toFixed(2)}`],
                  ['Preço original', `R$ ${selectedResult.originalPrice.toFixed(2)}`],
                  ['Desconto', `${selectedResult.discountPercentage}%`],
                  ['Avaliação', `${selectedResult.rating} ★`],
                  ['Vendas', selectedResult.salesVolume],
                  ['Comissão', `R$ ${selectedResult.commissionAmount.toFixed(2)}`],
                  ['Deal Score', String(selectedResult.score)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#080E1C] border border-[#14203B]">
                    <span className="text-[11px] text-[#8E9BAE]">{label}</span>
                    <span className="text-xs font-medium font-mono-numeric text-[#E6E8EC]">{value}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-[#0B1324] border border-[#162340] rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#00C2FF] shrink-0" />
                  <span className="text-xs font-semibold text-[#E6E8EC]">Decisão do Motor</span>
                </div>

                {selectedResult.status === 'qualified' ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Deal Score {selectedResult.score} ≥ 85</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Desconto {selectedResult.discountPercentage}% ≥ 30%</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Avaliação {selectedResult.rating} ≥ 4,5</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Comissão R$ {selectedResult.commissionAmount.toFixed(2)} ≥ R$ 3,00</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-[11px] text-amber-400">
                    <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      {selectedResult.rejectReason || 'Oferta não atendeu aos critérios de qualificação.'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-[#14203B] bg-[#0A1020]">
              <Button variant="outline" size="sm" onClick={() => setSelectedResult(null)} className="w-full text-xs">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0E172C] border border-[#1E3563] text-[#E6E8EC] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
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
