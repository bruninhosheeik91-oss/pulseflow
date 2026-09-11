import React, { useState, useEffect } from 'react';
import {
  X,
  Radar,
  ListChecks,
  RefreshCw,
  Share2,
  CheckCircle2,
  Globe,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { Automation, AutomationType } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { MarketplaceBadge } from '../ui/MarketplaceBadge';

interface AutomationConfigureDrawerProps {
  automation: Automation | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updated: Automation) => void;
}

const ALL_MARKETPLACES: Automation['marketplaces'][number][] = [
  'Shopee',
  'Mercado Livre',
  'Amazon',
  'AliExpress',
  'Magalu',
  'TikTok Shop',
];

const TYPE_ICONS: Record<AutomationType, React.ElementType> = {
  AUTO_SEARCH: Radar,
  LINK_LIST: ListChecks,
  MIRROR: RefreshCw,
  MONITOR_GROUP: Share2,
};

export const AutomationConfigureDrawer: React.FC<
  AutomationConfigureDrawerProps
> = ({ automation, isOpen, onClose, onSave }) => {
  const [draft, setDraft] = useState<Automation | null>(automation);
  const [copied, setCopied] = useState(false);
  const [savedText, setSavedText] = useState('');

  useEffect(() => {
    setDraft(automation);
    setCopied(false);
    setSavedText('');
  }, [automation]);

  if (!isOpen || !automation) return null;

  const a = draft ?? automation;
  const Icon = TYPE_ICONS[a.type];
  const isActive = a.status === 'ACTIVE';

  const updateDraft = (patch: Partial<Automation>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const toggleMarketplace = (mp: Automation['marketplaces'][number]) => {
    if (!a.marketplaces.includes(mp)) {
      updateDraft({ marketplaces: [...a.marketplaces, mp] });
    }
  };

  const removeMarketplace = (mp: Automation['marketplaces'][number]) => {
    updateDraft({
      marketplaces: a.marketplaces.filter((m) => m !== mp),
    });
  };

  const toggleSource = (id: string) => {
    const next = a.sources.map((s) =>
      s.id === id
        ? { ...s, active: s.active !== undefined ? !s.active : false }
        : s
    );
    updateDraft({ sources: next });
  };

  const toggleStatus = () => {
    updateDraft({
      status: a.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave(a);
      setCopied(true);
      setSavedText(
        isActive ? 'Automação reativa.' : 'Automação pausada. Alterações salvas.'
      );
      setTimeout(() => {
        setCopied(false);
        setSavedText('');
      }, 2500);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderCapabilityRow = (
    label: string,
    state: Automation['capabilities'][keyof Automation['capabilities']],
    description: string
  ) => {
    const stateUi =
      state === 'AVAILABLE' ? (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
          <CheckCircle2 className="w-3 h-3" />
          Disponível
        </span>
      ) : state === 'REQUIRES_INTEGRATION' ? (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25">
          <Globe className="w-3 h-3" />
          Requer integração
        </span>
      ) : state === 'REQUIRES_CONFIGURATION' ? (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#00C2FF] bg-[#1E5EFF]/15 px-2 py-0.5 rounded border border-[#1E5EFF]/30">
          <ShieldCheck className="w-3 h-3" />
          Requer configuração
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8E9BAE] bg-[#131F38] px-2 py-0.5 rounded border border-[#1C2C50]">
          Não suportado
        </span>
      );

    return (
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-[#080E1C] border border-[#14203B]">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#E6E8EC]">{label}</p>
          <p className="text-[10px] text-[#64748B] mt-0.5">{description}</p>
        </div>
        {stateUi}
      </div>
    );
  };

  const renderIntegrationHint = () => {
    if (a.type !== 'MIRROR' && a.type !== 'MONITOR_GROUP') {
      return null;
    }
    return (
      <div className="flex items-start gap-2.5 p-3 bg-[#0E2030] border border-[#1C3A4E] rounded-lg text-[11px] text-[#94A3B8]">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="font-semibold text-amber-300">
            Disponibilidade depende da integração utilizada.
          </span>{' '}
          A implementação real será validada conforme as capacidades oficiais
          das plataformas. Nenhuma leitura, captura ou envio externo é realizado
          nesta etapa.
        </p>
      </div>
    );
  };

  const renderConfigFields = () => {
    switch (a.type) {
      case 'AUTO_SEARCH':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-[#8E9BAE] uppercase tracking-wider block">
                Marketplaces monitorados
              </span>
              <div className="flex flex-wrap gap-2">
                {a.marketplaces.map((mp) => (
                  <button
                    key={mp}
                    type="button"
                    onClick={() => removeMarketplace(mp)}
                    title={`Remover ${mp}`}
                    className="hover:opacity-75 transition-opacity cursor-pointer group"
                  >
                    <MarketplaceBadge marketplace={mp} size="sm" />
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_MARKETPLACES.filter(
                  (mp) => !a.marketplaces.includes(mp)
                ).map((mp) => (
                  <button
                    key={mp}
                    type="button"
                    onClick={() => toggleMarketplace(mp)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium text-[#8E9BAE] bg-[#0A1020] border border-dashed border-[#1C2C50] hover:border-[#1E5EFF] hover:text-[#00C2FF] transition-colors cursor-pointer"
                  >
                    + {mp}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-[#8E9BAE] uppercase tracking-wider block">
                Critérios de aceite
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  ['Deal Score mínimo', '84 pts'],
                  ['Desconto mínimo', '35% OFF'],
                  ['Avaliação mínima', '4.5 ★'],
                  ['Frequência de busca', 'a cada 30 min'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="p-2.5 bg-[#080E1C] border border-[#14203B] rounded-lg"
                  >
                    <span className="text-[10px] text-[#64748B] block">
                      {label}
                    </span>
                    <span className="text-xs font-bold text-[#E6E8EC] mt-0.5 block">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-[#8E9BAE] uppercase tracking-wider block">
                Categorias prioritárias
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['Eletrônicos', 'Casa & Cozinha', 'Utilidades', 'Games'].map(
                  (cat) => (
                    <Badge key={cat} variant="default" size="xs">
                      {cat}
                    </Badge>
                  )
                )}
              </div>
            </div>
          </div>
        );
      case 'LINK_LIST':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#8E9BAE] uppercase tracking-wider">
                  Listas existentes
                </span>
                <Button variant="primary" size="xs">
                  Nova lista
                </Button>
              </div>
              <div className="space-y-1.5">
                {a.sources.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#080E1C] border border-[#14203B]"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#E6E8EC] truncate">
                        {s.name}
                      </p>
                      <p className="text-[10px] text-[#64748B] truncate">
                        {s.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSource(s.id)}
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer shrink-0 ${
                        s.active === false
                          ? 'text-[#8E9BAE] bg-[#131F38] border-[#1C2C50]'
                          : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                      }`}
                      title={
                        s.active === false
                          ? 'Ativar esta lista'
                          : 'Pausar esta lista'
                      }
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {s.active === false ? 'Pausada' : 'Ativa'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                ['Links totais', '487'],
                ['Processados', '408'],
                ['Pendentes', '79'],
                ['Inválidos', '18'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="p-2.5 bg-[#080E1C] border border-[#14203B] rounded-lg"
                >
                  <span className="text-[10px] text-[#64748B] block">
                    {label}
                  </span>
                  <span className="text-sm font-bold font-mono-numeric text-[#E6E8EC] mt-0.5 block">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-[#8E9BAE] uppercase tracking-wider block">
                Detecção da origem e validação
              </span>
              <div className="space-y-1.5">
                {renderCapabilityRow(
                  'Validação de links',
                  'AVAILABLE',
                  'Confirmar origem e acessibilidade da URL'
                )}
                {renderCapabilityRow(
                  'Deduplicação automática',
                  'AVAILABLE',
                  'Comparar com entradas já existentes na operação'
                )}
                {renderCapabilityRow(
                  'Preparar link de afiliado',
                  'REQUIRES_CONFIGURATION',
                  'Associar ao programa de afiliado do marketplace'
                )}
              </div>
            </div>
          </div>
        );
      case 'MIRROR':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#8E9BAE] uppercase tracking-wider">
                  Fontes configuradas
                </span>
                <Button variant="outline" size="xs">
                  Adicionar fonte
                </Button>
              </div>
              <div className="space-y-1.5">
                {a.sources.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#080E1C] border border-[#14203B]"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#E6E8EC] truncate">
                        {s.name}
                      </p>
                      <p className="text-[10px] text-[#64748B] truncate">
                        {s.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSource(s.id)}
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer shrink-0 ${
                        s.active === false
                          ? 'text-[#8E9BAE] bg-[#131F38] border-[#1C2C50]'
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/25'
                      }`}
                      title={
                        s.active === false
                          ? 'Ativar esta fonte'
                          : 'Pausar esta fonte'
                      }
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {s.active === false ? 'Pausada' : 'Ativa'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#8E9BAE] uppercase tracking-wider block">
                Capacidades do espelhamento
              </span>
              {renderCapabilityRow(
                'Captura de novas publicações',
                'REQUIRES_INTEGRATION',
                'Leitura de novas entradas na fonte configurada'
              )}
              {renderCapabilityRow(
                'Identificação do produto / link',
                'AVAILABLE',
                'Interpretação e extração da oferta'
              )}
              {renderCapabilityRow(
                'Preparar / substituir link de afiliado',
                'REQUIRES_CONFIGURATION',
                'Geração autorizada do link de afiliado'
              )}
              {renderCapabilityRow(
                'Enviar para a fila',
                'AVAILABLE',
                'Inserção no pipeline central de distribuição'
              )}
            </div>

            {renderIntegrationHint()}
          </div>
        );
      case 'MONITOR_GROUP':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-[#8E9BAE] uppercase tracking-wider block">
                Fonte principal
              </span>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#080E1C] border border-[#14203B]">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#E6E8EC] truncate">
                    {a.sources[0]?.name}
                  </p>
                  <p className="text-[10px] text-[#64748B] truncate">
                    Fonte central de distribuição
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => a.sources[0] && toggleSource(a.sources[0].id)}
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer shrink-0 ${
                    a.sources[0]?.active === false
                      ? 'text-[#8E9BAE] bg-[#131F38] border-[#1C2C50]'
                      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {a.sources[0]?.active === false ? 'Pausada' : 'Ativa'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                ['Entradas hoje', '18'],
                ['Destinos', '12'],
                ['Distribuições', '196'],
                ['Proteção anti-duplicidade', 'Ativa'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="p-2.5 bg-[#080E1C] border border-[#14203B] rounded-lg"
                >
                  <span className="text-[10px] text-[#64748B] block">
                    {label}
                  </span>
                  <span className="text-xs font-bold text-[#E6E8EC] mt-0.5 block">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#8E9BAE] uppercase tracking-wider block">
                Capacidades do grupo monitor
              </span>
              {renderCapabilityRow(
                'Detectar novas entradas',
                'REQUIRES_INTEGRATION',
                'Monitoramento da fonte central configurada'
              )}
              {renderCapabilityRow(
                'Roteamento para destinos',
                'AVAILABLE',
                'Distribuição para canais e grupos conectados'
              )}
              {renderCapabilityRow(
                'Processamento e regras',
                'AVAILABLE',
                'Aplicação de campanhas e filtros'
              )}
              {renderCapabilityRow(
                'Envio automático de mensagens',
                'REQUIRES_INTEGRATION',
                'Depende da capacidade oficial da plataforma'
              )}
            </div>

            {renderIntegrationHint()}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-xl w-full bg-[#070C18] border-l border-[#162340] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#14203B] bg-[#0A1020] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#14203B] border border-[#1E3057] flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-[#00C2FF]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#E6E8EC] truncate">
                  {a.name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    isActive
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  {isActive ? 'Ativa' : 'Pausada'}
                </span>
              </div>
              <p className="text-[11px] text-[#8E9BAE] mt-0.5 truncate">
                {a.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8E9BAE] hover:text-[#E6E8EC] hover:bg-[#121E38] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Summary strip */}
          <div className="grid grid-cols-4 gap-2.5">
            <div className="p-3 bg-[#0B1324] border border-[#162340] rounded-xl text-center">
              <span className="text-[10px] text-[#64748B] uppercase block">
                Entradas
              </span>
              <span className="text-sm font-bold font-mono-numeric text-[#E6E8EC]">
                {a.metrics.entriesToday.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="p-3 bg-[#0B1324] border border-[#162340] rounded-xl text-center">
              <span className="text-[10px] text-[#64748B] uppercase block">
                Processadas
              </span>
              <span className="text-sm font-bold font-mono-numeric text-[#00C2FF]">
                {a.metrics.processed.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="p-3 bg-[#0B1324] border border-[#162340] rounded-xl text-center">
              <span className="text-[10px] text-[#64748B] uppercase block">
                Na fila
              </span>
              <span className="text-sm font-bold font-mono-numeric text-[#38BDF8]">
                {a.metrics.queued}
              </span>
            </div>
            <div className="p-3 bg-[#0B1324] border border-[#162340] rounded-xl text-center">
              <span className="text-[10px] text-[#64748B] uppercase block">
                Última execução
              </span>
              <span className="text-xs font-bold font-mono-numeric text-emerald-400">
                {a.metrics.lastRun}
              </span>
            </div>
          </div>

          {/* Config fields */}
          <div className="p-4 bg-[#0B1324] border border-[#162340] rounded-xl space-y-4">
            <span className="text-xs font-semibold text-[#8E9BAE] uppercase tracking-wider block">
              Configuração da automação
            </span>
            {renderConfigFields()}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#14203B] bg-[#0A1020] flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleStatus}
              className={`text-xs border-[#182747] ${
                isActive
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              {isActive ? 'Pausar automação' : 'Retomar automação'}
            </Button>
            <Button
              variant={isActive ? 'primary' : 'outline'}
              size="sm"
              onClick={handleSave}
              className={
                isActive
                  ? 'text-xs'
                  : 'text-xs border-[#1E5EFF] text-[#00C2FF]'
              }
            >
              {copied ? 'Salvo!' : 'Salvar alterações'}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] text-[#64748B]">
              {savedText ||
                'Configurações mockadas — integrações reais serão validadas posteriormente.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};