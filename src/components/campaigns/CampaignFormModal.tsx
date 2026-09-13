import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Plus,
  Sliders,
  Radio,
  Clock,
  Zap,
  Save,
  Tag,
} from 'lucide-react';
import {
  Campaign,
  Marketplace,
  CampaignExecutionMode,
  CampaignCopyTemplate,
  AutomationType,
} from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface CampaignFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCampaign: (campaignData: Partial<Campaign>) => void;
  initialCampaign?: Campaign | null;
}

const ALL_MARKETPLACES: Marketplace[] = [
  'Shopee',
  'Mercado Livre',
  'Amazon',
  'AliExpress',
  'Magalu',
  'TikTok Shop',
];

const AVAILABLE_CHANNELS = [
  'WhatsApp Tech & Gamers VIP',
  'Telegram Radar de Ofertas Geral',
  'WhatsApp Achadinhos da Shopee & Ali',
  'Telegram Casa & Cozinha Ofertas',
  'WhatsApp Moda, Beleza & Cupons',
  'WhatsApp Super Promoções Relâmpago 02',
];

const AUTOMATION_OPTIONS: { id: AutomationType; label: string }[] = [
  { id: 'AUTO_SEARCH', label: 'Busca Automática' },
  { id: 'LINK_LIST', label: 'Lista de Links' },
  { id: 'MIRROR', label: 'Espelhamento' },
  { id: 'MONITOR_GROUP', label: 'Grupo Monitor' },
];

const CATEGORIES_LIST = [
  'Eletrônicos',
  'Casa e Limpeza',
  'Cozinha',
  'Periféricos',
  'Utilidades Domésticas',
  'Acessórios Tech',
  'Moda',
  'Esportes',
  'Beleza e Cuidados',
];

export const CampaignFormModal: React.FC<CampaignFormModalProps> = ({
  isOpen,
  onClose,
  onSaveCampaign,
  initialCampaign,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [executionMode, setExecutionMode] =
    useState<CampaignExecutionMode>('Automático');
  const [selectedAutomations, setSelectedAutomations] = useState<
    AutomationType[]
  >(['AUTO_SEARCH', 'LINK_LIST']);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<
    Marketplace[]
  >(['Shopee', 'Mercado Livre', 'Amazon']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Eletrônicos',
  ]);
  const [minScore, setMinScore] = useState(84);
  const [minDiscount, setMinDiscount] = useState(25);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [requireFreeShipping, setRequireFreeShipping] = useState(false);
  const [requireCoupon, setRequireCoupon] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    'WhatsApp Tech & Gamers VIP',
  ]);
  const [frequency, setFrequency] = useState('30m');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('23:00');
  const [copyTemplate, setCopyTemplate] =
    useState<CampaignCopyTemplate>('Urgência / Fogo');

  // Populate when editing
  useEffect(() => {
    if (initialCampaign) {
      setName(initialCampaign.name);
      setDescription(initialCampaign.description);
      setExecutionMode(initialCampaign.executionMode);
      setSelectedAutomations(initialCampaign.automationSources);
      setSelectedMarketplaces(initialCampaign.marketplaces);
      setSelectedCategories(initialCampaign.categories);
      setMinScore(initialCampaign.minScore);
      setMinDiscount(initialCampaign.minDiscount);
      setMinPrice(initialCampaign.minPrice ? String(initialCampaign.minPrice) : '');
      setMaxPrice(initialCampaign.maxPrice ? String(initialCampaign.maxPrice) : '');
      setRequireFreeShipping(initialCampaign.requireFreeShipping);
      setRequireCoupon(initialCampaign.requireCoupon);
      setSelectedChannels(initialCampaign.channels);
      setFrequency(initialCampaign.frequency);
      setStartTime(initialCampaign.activeHours.start);
      setEndTime(initialCampaign.activeHours.end);
      setCopyTemplate(initialCampaign.copyTemplate);
    } else {
      // Defaults for new campaign
      setName('');
      setDescription('');
      setExecutionMode('Automático');
      setSelectedAutomations(['AUTO_SEARCH', 'LINK_LIST']);
      setSelectedMarketplaces(['Shopee', 'Mercado Livre', 'Amazon']);
      setSelectedCategories(['Eletrônicos']);
      setMinScore(84);
      setMinDiscount(25);
      setMinPrice('');
      setMaxPrice('');
      setRequireFreeShipping(false);
      setRequireCoupon(false);
      setSelectedChannels(['WhatsApp Tech & Gamers VIP']);
      setFrequency('30m');
      setStartTime('08:00');
      setEndTime('23:00');
      setCopyTemplate('Urgência / Fogo');
    }
  }, [initialCampaign, isOpen]);

  const toggleMarketplace = (mp: Marketplace) => {
    setSelectedMarketplaces((prev) =>
      prev.includes(mp) ? prev.filter((m) => m !== mp) : [...prev, mp]
    );
  };

  const toggleAutomation = (auto: AutomationType) => {
    setSelectedAutomations((prev) =>
      prev.includes(auto) ? prev.filter((a) => a !== auto) : [...prev, auto]
    );
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const frequencyLabelMap: Record<string, string> = {
      '15m': 'A cada 15 minutos',
      '20m': 'A cada 20 minutos',
      '30m': 'A cada 30 minutos',
      '45m': 'A cada 45 minutos',
      '60m': 'A cada 1 hora',
      '2h': 'A cada 2 horas',
    };

    onSaveCampaign({
      name,
      description:
        description ||
        `Campanha de automação para ${selectedMarketplaces.join(', ')} com Deal Score ≥ ${minScore}.`,
      executionMode,
      automationSources:
        selectedAutomations.length > 0 ? selectedAutomations : ['AUTO_SEARCH'],
      marketplaces:
        selectedMarketplaces.length > 0 ? selectedMarketplaces : ['Shopee'],
      categories:
        selectedCategories.length > 0 ? selectedCategories : ['Todas'],
      minScore,
      minDiscount,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      requireFreeShipping,
      requireCoupon,
      channels:
        selectedChannels.length > 0
          ? selectedChannels
          : ['WhatsApp Tech & Gamers VIP'],
      frequency,
      frequencyLabel: frequencyLabelMap[frequency] || 'A cada 30 minutos',
      activeHours: { start: startTime, end: endTime },
      copyTemplate,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialCampaign ? 'Editar Campanha' : 'Nova Campanha de Automação'}
      subtitle="Defina parâmetros de varredura do motor, thresholds de score e canais de disparo."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {/* Identificação */}
        <div className="space-y-3 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
            1. Identificação da Campanha
          </span>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#172033]">
              Nome da Campanha <span className="text-rose-700">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Achadinhos Tech Shopee & Amazon 40% OFF"
              className="w-full h-9 px-3 bg-[#FFFFFF] border border-[#CBD5E1] rounded-lg text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#172033]">
              Descrição / Objetivo
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a finalidade desta campanha..."
              className="w-full p-2.5 bg-[#FFFFFF] border border-[#CBD5E1] rounded-lg text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          {/* Modo de Execução */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#172033]">
              Modo de Operação
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExecutionMode('Automático')}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  executionMode === 'Automático'
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-white'
                    : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:border-[#BFDBFE]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#172033]">
                  <span>Automático Direto</span>
                  {executionMode === 'Automático' && (
                    <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                  )}
                </div>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Ofertas aprovadas são disparadas automaticamente para os canais.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setExecutionMode('Revisão Manual')}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  executionMode === 'Revisão Manual'
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-white'
                    : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:border-[#BFDBFE]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#172033]">
                  <span>Fila de Revisão Manual</span>
                  {executionMode === 'Revisão Manual' && (
                    <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                  )}
                </div>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Ofertas encontradas vão para a fila aguardando aprovação do operador.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Origens de Automação */}
        <div className="space-y-3 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
            2. Origens de Automação (Como as ofertas entram)
          </span>
          <p className="text-[11px] text-[#64748B] leading-relaxed -mt-1">
            Esta campanha recebe entradas das automações selecionadas e aplica
            as regras abaixo. Automação define <strong>como</strong> entra;
            campanha define <strong>quais regras</strong> serão aplicadas.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {AUTOMATION_OPTIONS.map((auto) => {
              const active = selectedAutomations.includes(auto.id);
              return (
                <button
                  key={auto.id}
                  type="button"
                  onClick={() => toggleAutomation(auto.id)}
                  className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#DBEAFE] border-[#2563EB] text-white'
                      : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:border-[#BFDBFE]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-[#172033]">
                    <span>{auto.label}</span>
                    {active && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Marketplaces & Categorias */}
        <div className="space-y-3 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
            3. Marketplaces & Categorias
          </span>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#172033]">
              Marketplaces Monitorados
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_MARKETPLACES.map((mp) => {
                const active = selectedMarketplaces.includes(mp);
                return (
                  <button
                    key={mp}
                    type="button"
                    onClick={() => toggleMarketplace(mp)}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#DBEAFE] border-[#2563EB] text-[#172033]'
                        : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:border-[#BFDBFE]'
                    }`}
                  >
                    <span>{mp}</span>
                    {active && <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-medium text-[#172033]">
              Categorias Alvo
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES_LIST.map((cat) => {
                const active = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#DBEAFE] border-[#2563EB] text-[#2563EB]'
                        : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:border-[#BFDBFE]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Critérios do Deal Score e Filtros */}
        <div className="space-y-3 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
            4. Critérios do Motor & Deal Score
          </span>

          {/* Slider Min Score */}
          <div className="space-y-1.5 p-3 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#172033]">
                Deal Score Mínimo
              </span>
              <span className="font-mono-numeric font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#93C5FD]">
                {minScore} pts ({minScore >= 90 ? 'Excelente' : minScore >= 80 ? 'Muito Bom' : 'Bom'})
              </span>
            </div>
            <input
              type="range"
              min="70"
              max="95"
              step="1"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
            />
          </div>

          {/* Slider Desconto Mínimo */}
          <div className="space-y-1.5 p-3 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#172033]">
                Desconto Mínimo Exigido
              </span>
              <span className="font-mono-numeric font-bold text-[#3B82F6] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#93C5FD]">
                {minDiscount}% OFF
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="60"
              step="5"
              value={minDiscount}
              onChange={(e) => setMinDiscount(Number(e.target.value))}
              className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
            />
          </div>

          {/* Faixa de Preço */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[#64748B]">Preço Mínimo (R$)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Ex: 50"
                className="w-full h-8 px-3 bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#64748B]">Preço Máximo (R$)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Ex: 2500"
                className="w-full h-8 px-3 bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          {/* Booleans */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2 p-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg cursor-pointer text-xs text-[#334155]">
              <input
                type="checkbox"
                checked={requireFreeShipping}
                onChange={(e) => setRequireFreeShipping(e.target.checked)}
                className="rounded border-[#CBD5E1] bg-[#F8FAFC] text-[#2563EB] focus:ring-0"
              />
              <span>Frete grátis obrigatório</span>
            </label>

            <label className="flex items-center gap-2 p-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg cursor-pointer text-xs text-[#334155]">
              <input
                type="checkbox"
                checked={requireCoupon}
                onChange={(e) => setRequireCoupon(e.target.checked)}
                className="rounded border-[#CBD5E1] bg-[#F8FAFC] text-[#2563EB] focus:ring-0"
              />
              <span>Cupom de desconto ativo</span>
            </label>
          </div>
        </div>

        {/* Canais e Frequência */}
        <div className="space-y-3 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
            5. Distribuição & Anti-Spam
          </span>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#172033]">
              Canais de Envio
            </label>
            <div className="space-y-1.5">
              {AVAILABLE_CHANNELS.map((ch) => {
                const active = selectedChannels.includes(ch);
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleChannel(ch)}
                    className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#DBEAFE] border-[#2563EB] text-white'
                        : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:border-[#BFDBFE]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>{ch}</span>
                    </div>
                    {active && <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs text-[#64748B]">
                Intervalo entre disparos (Anti-Spam)
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full h-8 px-2 bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="15m">A cada 15 minutos</option>
                <option value="20m">A cada 20 minutos</option>
                <option value="30m">A cada 30 minutos</option>
                <option value="45m">A cada 45 minutos</option>
                <option value="60m">A cada 1 hora</option>
                <option value="2h">A cada 2 horas</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#64748B]">Template de Copy</label>
              <select
                value={copyTemplate}
                onChange={(e) =>
                  setCopyTemplate(e.target.value as CampaignCopyTemplate)
                }
                className="w-full h-8 px-2 bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="Urgência / Fogo">Urgência / Fogo 🔥</option>
                <option value="Padrão com Emojis">Padrão com Emojis ⭐</option>
                <option value="Minimalista Direto">Minimalista Direto</option>
                <option value="Cupom em Destaque">Cupom em Destaque 🏷️</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            leftIcon={initialCampaign ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            className="text-xs font-semibold px-4"
          >
            {initialCampaign ? 'Salvar Alterações' : 'Criar Campanha'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
