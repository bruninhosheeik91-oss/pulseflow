import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Check, Sliders } from 'lucide-react';
import { ProductFilterState, Marketplace } from '../../types';
import { Button } from '../ui/Button';
import { MarketplaceBadge } from '../ui/MarketplaceBadge';

export const initialProductFilterState: ProductFilterState = {
  category: 'Todas',
  marketplaces: [],
  minOffers: 0,
  minScore: 0,
  minPrice: '',
  maxPrice: '',
  status: 'Todos',
  performance: 'Todas',
};

interface ProductFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ProductFilterState;
  onApplyFilters: (filters: ProductFilterState) => void;
  onResetFilters: () => void;
}

export const ProductFiltersDrawer: React.FC<ProductFiltersDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
}) => {
  const [draft, setDraft] = useState<ProductFilterState>(filters);

  // Sync draft when opened or filters change
  useEffect(() => {
    if (isOpen) {
      setDraft(filters);
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const categories = [
    'Todas',
    'Eletrônicos',
    'Casa & Cozinha',
    'Moda',
    'Beleza',
    'Games',
    'Automotivo',
    'Infantil',
    'Ferramentas',
    'Informática',
    'Outros',
  ];

  const marketplaceList: Marketplace[] = [
    'Shopee',
    'Mercado Livre',
    'Amazon',
    'AliExpress',
    'Magalu',
    'TikTok Shop',
    'Outros',
  ];

  const offersOptions = [
    { label: 'Qualquer', value: 0 },
    { label: '1+', value: 1 },
    { label: '2+', value: 2 },
    { label: '3+', value: 3 },
    { label: '5+', value: 5 },
  ];

  const statusOptions = [
    'Todos',
    'Com oferta ativa',
    'Sem oferta ativa',
    'Já publicado',
    'Nunca publicado',
  ];

  const performanceOptions = ['Todas', 'Alta', 'Média', 'Baixa', 'Sem dados'];

  const toggleMarketplace = (mp: Marketplace) => {
    setDraft((prev) => {
      const exists = prev.marketplaces.includes(mp);
      return {
        ...prev,
        marketplaces: exists
          ? prev.marketplaces.filter((m) => m !== mp)
          : [...prev.marketplaces, mp],
      };
    });
  };

  const handleApply = () => {
    onApplyFilters(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft(initialProductFilterState);
    onResetFilters();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop click dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div className="w-full max-w-md bg-[#FFFFFF] border-l border-[#E2E8F0] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172033]">
                Filtros de produtos
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Refine o catálogo consolidado multimarketplace
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Filters Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* Categoria */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Categoria
            </span>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const isSelected = draft.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, category: cat }))}
                    className={`px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#DBEAFE] border-[#2563EB] text-[#2563EB] font-semibold'
                        : 'bg-[#F1F5F9] border-[#DCE3EC] text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Marketplaces (Múltipla Seleção) */}
          <div className="space-y-2 pt-3 border-t border-[#F1F5F9]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Marketplaces
              </span>
              <span className="text-[11px] text-[#2563EB]">
                {draft.marketplaces.length === 0
                  ? 'Todos'
                  : `${draft.marketplaces.length} selecionado(s)`}
              </span>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Produtos disponíveis em qualquer um dos canais selecionados
            </p>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {marketplaceList.map((mp) => {
                const isSelected = draft.marketplaces.includes(mp);
                return (
                  <button
                    key={mp}
                    type="button"
                    onClick={() => toggleMarketplace(mp)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#F8FAFC] border-[#2563EB] text-[#172033]'
                        : 'bg-[#F1F5F9] border-[#E2E8F0] text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <MarketplaceBadge marketplace={mp} size="xs" />
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-[#2563EB] border-[#2563EB] text-white'
                          : 'border-[#94A3B8] bg-[#FFFFFF]'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Número de Ofertas */}
          <div className="space-y-2 pt-3 border-t border-[#F1F5F9]">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Número de Ofertas
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {offersOptions.map((opt) => {
                const isSelected = draft.minOffers === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() =>
                      setDraft((p) => ({ ...p, minOffers: opt.value }))
                    }
                    className={`py-1.5 text-center rounded-md border text-xs font-mono-numeric transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#DBEAFE] border-[#2563EB] text-[#2563EB] font-bold'
                        : 'bg-[#F1F5F9] border-[#DCE3EC] text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deal Score */}
          <div className="space-y-2 pt-3 border-t border-[#F1F5F9]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Deal Score Mínimo
              </span>
              <span className="text-xs font-mono-numeric font-bold text-[#2563EB]">
                {draft.minScore === 0 ? 'Qualquer' : `${draft.minScore} pts`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={draft.minScore}
              onChange={(e) =>
                setDraft((p) => ({ ...p, minScore: Number(e.target.value) }))
              }
              className="w-full accent-[#2563EB] bg-[#EFF6FF] h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex items-center justify-between gap-1 pt-1">
              {[0, 75, 85, 90].map((scorePreset) => (
                <button
                  key={scorePreset}
                  type="button"
                  onClick={() =>
                    setDraft((p) => ({ ...p, minScore: scorePreset }))
                  }
                  className={`px-2 py-1 rounded text-[11px] border font-mono-numeric transition-colors cursor-pointer ${
                    draft.minScore === scorePreset
                      ? 'bg-[#DBEAFE] border-[#2563EB] text-[#2563EB]'
                      : 'bg-[#F8FAFC] border-[#DCE3EC] text-[#64748B]'
                  }`}
                >
                  {scorePreset === 0 ? 'Qualquer' : `${scorePreset}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Preço Mínimo e Máximo */}
          <div className="space-y-2 pt-3 border-t border-[#F1F5F9]">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Faixa de Preço (R$)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-[#64748B] block mb-1">
                  Mínimo
                </label>
                <input
                  type="number"
                  placeholder="R$ 0,00"
                  value={draft.minPrice}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, minPrice: e.target.value }))
                  }
                  className="w-full h-8.5 px-2.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#64748B] block mb-1">
                  Máximo
                </label>
                <input
                  type="number"
                  placeholder="R$ 5.000,00"
                  value={draft.maxPrice}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, maxPrice: e.target.value }))
                  }
                  className="w-full h-8.5 px-2.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2 pt-3 border-t border-[#F1F5F9]">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Status do Produto
            </span>
            <div className="flex flex-wrap gap-1.5">
              {statusOptions.map((st) => {
                const isSelected = draft.status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, status: st }))}
                    className={`px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#DBEAFE] border-[#2563EB] text-[#2563EB] font-semibold'
                        : 'bg-[#F1F5F9] border-[#DCE3EC] text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Performance */}
          <div className="space-y-2 pt-3 border-t border-[#F1F5F9]">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Performance Operacional
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {performanceOptions.map((perf) => {
                const isSelected = draft.performance === perf;
                return (
                  <button
                    key={perf}
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, performance: perf }))}
                    className={`py-1.5 px-2 text-center rounded-md border text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#DBEAFE] border-[#2563EB] text-[#2563EB] font-semibold'
                        : 'bg-[#F1F5F9] border-[#DCE3EC] text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    {perf}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#FFFFFF] flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5 text-[#64748B]" />}
            className="text-xs text-[#64748B] hover:text-[#172033] border-[#DCE3EC]"
          >
            Limpar filtros
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            className="text-xs font-semibold px-4"
          >
            Aplicar filtros
          </Button>
        </div>
      </div>
    </div>
  );
};
