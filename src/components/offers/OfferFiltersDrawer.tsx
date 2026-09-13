import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import { Button } from '../ui/Button';

export interface OfferFilterState {
  marketplaces: string[]; // empty means all marketplaces
  category: string; // 'Todas' or specific
  minPrice: string;
  maxPrice: string;
  minDiscount: number; // 0, 20, 30, 40, 50, 60
  minRating: number; // 0 (Qualquer), 4.0, 4.5, 4.7, 4.8
  minSales: number; // 0 (Qualquer), 100, 1000, 5000, 10000
  minCommission: string;
  minScore: number; // 0 to 100
  statuses: string[]; // ['Em análise', 'Aprovada', 'Rejeitada', 'Publicada', 'Agendada']
}

export const initialFilterState: OfferFilterState = {
  marketplaces: [],
  category: 'Todas',
  minPrice: '',
  maxPrice: '',
  minDiscount: 0,
  minRating: 0,
  minSales: 0,
  minCommission: '',
  minScore: 0,
  statuses: [],
};

interface OfferFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: OfferFilterState;
  onApplyFilters: (filters: OfferFilterState) => void;
  onResetFilters: () => void;
}

export const OfferFiltersDrawer: React.FC<OfferFiltersDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
}) => {
  const [draft, setDraft] = useState<OfferFilterState>(filters);

  // Sync draft when opened or filters change
  useEffect(() => {
    if (isOpen) {
      setDraft(filters);
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const marketplaceOptions = [
    'Shopee',
    'Mercado Livre',
    'Amazon',
    'AliExpress',
    'Magalu',
    'TikTok Shop',
    'Outros',
  ];

  const categories = [
    'Todas',
    'Eletrônicos',
    'Casa & Cozinha',
    'Moda',
    'Beleza',
    'Games',
    'Automotivo',
    'Infantil',
  ];

  const discountOptions = [0, 20, 30, 40, 50, 60];
  const ratingOptions = [
    { label: 'Qualquer', value: 0 },
    { label: '4.0+', value: 4.0 },
    { label: '4.5+', value: 4.5 },
    { label: '4.7+', value: 4.7 },
    { label: '4.8+', value: 4.8 },
  ];
  const salesOptions = [
    { label: 'Qualquer', value: 0 },
    { label: '100+', value: 100 },
    { label: '1.000+', value: 1000 },
    { label: '5.000+', value: 5000 },
    { label: '10.000+', value: 10000 },
  ];
  const statusOptions = [
    'Em análise',
    'Aprovada',
    'Rejeitada',
    'Publicada',
    'Agendada',
  ];

  const toggleMarketplace = (mp: string) => {
    setDraft((prev) => {
      const exists = prev.marketplaces.includes(mp);
      const updated = exists
        ? prev.marketplaces.filter((m) => m !== mp)
        : [...prev.marketplaces, mp];
      return { ...prev, marketplaces: updated };
    });
  };

  const selectAllMarketplaces = () => {
    setDraft((prev) => ({ ...prev, marketplaces: [] }));
  };

  const toggleStatus = (st: string) => {
    setDraft((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(st)
        ? prev.statuses.filter((s) => s !== st)
        : [...prev.statuses, st],
    }));
  };

  const handleApply = () => {
    onApplyFilters(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft(initialFilterState);
    onResetFilters();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-[#F4F7FB] border-l border-[#DCE3EC] h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="h-16 px-6 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-[#FFFFFF]">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold text-[#172033]">
              Filtros de ofertas
            </h3>
            <span className="text-xs font-mono-numeric text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
              Refine a busca
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#E2E8F0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Filters Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* MARKETPLACE (MULTIMARKETPLACE SUPPORT) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#172033] uppercase tracking-wider block">
                Marketplace
              </label>
              {draft.marketplaces.length > 0 ? (
                <span className="text-[11px] font-mono-numeric text-[#2563EB] font-medium bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                  {draft.marketplaces.length} selecionado{draft.marketplaces.length > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-[11px] text-[#64748B]">Todos ativos</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={selectAllMarketplaces}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  draft.marketplaces.length === 0
                    ? 'bg-[#DBEAFE] border-[#2563EB] text-[#2563EB] shadow-xs'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#94A3B8] hover:text-[#172033]'
                }`}
              >
                Todos
              </button>
              {marketplaceOptions.map((mp) => {
                const active = draft.marketplaces.includes(mp);
                return (
                  <button
                    key={mp}
                    type="button"
                    onClick={() => toggleMarketplace(mp)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      active
                        ? 'bg-[#DBEAFE] border-[#2563EB] text-[#2563EB] shadow-xs'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#94A3B8] hover:text-[#172033]'
                    }`}
                  >
                    {mp}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CATEGORIA */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#172033] uppercase tracking-wider block">
              Categoria
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const active = draft.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDraft({ ...draft, category: cat })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      active
                        ? 'bg-[#DBEAFE] border-[#2563EB] text-[#2563EB] shadow-xs'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#94A3B8] hover:text-[#172033]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PREÇO */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#172033] uppercase tracking-wider block">
              Faixa de Preço
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-[#64748B] block mb-1">
                  Preço mínimo
                </span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] font-mono-numeric">
                    R$
                  </span>
                  <input
                    type="number"
                    placeholder="0,00"
                    value={draft.minPrice}
                    onChange={(e) =>
                      setDraft({ ...draft, minPrice: e.target.value })
                    }
                    className="w-full h-9 pl-9 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-mono-numeric text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>
              <div>
                <span className="text-xs text-[#64748B] block mb-1">
                  Preço máximo
                </span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] font-mono-numeric">
                    R$
                  </span>
                  <input
                    type="number"
                    placeholder="1.000,00"
                    value={draft.maxPrice}
                    onChange={(e) =>
                      setDraft({ ...draft, maxPrice: e.target.value })
                    }
                    className="w-full h-9 pl-9 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-mono-numeric text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DESCONTO MÍNIMO */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                Desconto Mínimo
              </label>
              <span className="text-xs font-mono-numeric text-[#2563EB] font-semibold">
                {draft.minDiscount > 0 ? `${draft.minDiscount}% ou mais` : 'Qualquer'}
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {discountOptions.map((disc) => {
                const active = draft.minDiscount === disc;
                return (
                  <button
                    key={disc}
                    type="button"
                    onClick={() => setDraft({ ...draft, minDiscount: disc })}
                    className={`py-1.5 rounded-lg text-xs font-mono-numeric font-medium border text-center transition-all ${
                      active
                        ? 'bg-[#DBEAFE] border-[#2563EB] text-[#2563EB]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#94A3B8]'
                    }`}
                  >
                    {disc === 0 ? '0%' : `${disc}%`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AVALIAÇÃO MÍNIMA */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#172033] uppercase tracking-wider block">
              Avaliação Mínima
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {ratingOptions.map((rat) => {
                const active = draft.minRating === rat.value;
                return (
                  <button
                    key={rat.value}
                    type="button"
                    onClick={() => setDraft({ ...draft, minRating: rat.value })}
                    className={`py-1.5 rounded-lg text-xs font-medium border text-center transition-all ${
                      active
                        ? 'bg-[#DBEAFE] border-[#2563EB] text-[#2563EB]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#94A3B8]'
                    }`}
                  >
                    {rat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* VENDAS MÍNIMAS */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#172033] uppercase tracking-wider block">
              Vendas Mínimas
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {salesOptions.map((sal) => {
                const active = draft.minSales === sal.value;
                return (
                  <button
                    key={sal.value}
                    type="button"
                    onClick={() => setDraft({ ...draft, minSales: sal.value })}
                    className={`py-1.5 rounded-lg text-xs font-mono-numeric font-medium border text-center transition-all ${
                      active
                        ? 'bg-[#DBEAFE] border-[#2563EB] text-[#2563EB]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#94A3B8]'
                    }`}
                  >
                    {sal.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* COMISSÃO MÍNIMA */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#172033] uppercase tracking-wider block">
              Comissão Mínima Estimada
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] font-mono-numeric">
                R$
              </span>
              <input
                type="number"
                placeholder="Ex: 5,00"
                value={draft.minCommission}
                onChange={(e) =>
                  setDraft({ ...draft, minCommission: e.target.value })
                }
                className="w-full h-9 pl-9 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-mono-numeric text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          {/* DEAL SCORE SLIDER */}
          <div className="space-y-2.5 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                Deal Score Mínimo
              </label>
              <span className="font-mono-numeric font-bold text-xs text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded border border-[#BFDBFE]">
                {draft.minScore === 0 ? 'Qualquer' : `${draft.minScore} pts`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={draft.minScore}
              onChange={(e) =>
                setDraft({ ...draft, minScore: Number(e.target.value) })
              }
              className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
            />
            <div className="flex justify-between text-[11px] text-[#94A3B8] font-mono-numeric">
              <span>0 (Todos)</span>
              <span>70 (Bom)</span>
              <span>80 (Muito bom)</span>
              <span>90 (Excelente)</span>
            </div>
          </div>

          {/* STATUS */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#172033] uppercase tracking-wider block">
              Status da Oferta
            </label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((st) => {
                const active = draft.statuses.includes(st);
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => toggleStatus(st)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      active
                        ? 'bg-[#DBEAFE] border-[#2563EB] text-[#172033]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#94A3B8]'
                    }`}
                  >
                    <span>{st}</span>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                        active
                          ? 'bg-[#2563EB] border-[#2563EB] text-white'
                          : 'border-[#93C5FD] bg-[#F8FAFC]'
                      }`}
                    >
                      {active && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Drawer Footer */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#FFFFFF] flex items-center justify-between gap-3 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs text-[#64748B] hover:text-[#172033]"
          >
            Limpar filtros
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            className="text-xs font-semibold px-6 shadow-sm shadow-[#2563EB]/30"
          >
            Aplicar filtros
          </Button>
        </div>
      </div>
    </div>
  );
};
