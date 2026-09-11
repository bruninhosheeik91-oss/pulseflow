import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Send,
  Calendar,
  Layers,
  Sparkles,
  MousePointerClick,
  ShoppingBag,
  DollarSign,
  Tag,
  ChevronDown,
  ChevronUp,
  Share2,
} from 'lucide-react';
import { Product, ProductMarketplaceOffer } from '../../types';
import { MarketplaceBadge } from '../ui/MarketplaceBadge';
import { OfferScoreBadge } from '../offers/OfferScoreBadge';
import { Button } from '../ui/Button';
import { OfferComparisonTable } from './OfferComparisonTable';
import { PriceHistorySection } from './PriceHistorySection';
import { PublicationHistorySection } from './PublicationHistorySection';
import { ProductInsightBox } from './ProductInsightBox';

interface ProductDetailDrawerProps {
  product: Product | null;
  onClose: () => void;
  onPublishOffer?: (product: Product, offer?: ProductMarketplaceOffer) => void;
  onScheduleOffer?: (product: Product, offer?: ProductMarketplaceOffer) => void;
}

export const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({
  product,
  onClose,
  onPublishOffer,
  onScheduleOffer,
}) => {
  const [showMappedTitles, setShowMappedTitles] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'comparador' | 'historico' | 'publicacoes'>(
    'comparador'
  );
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!product) return null;

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const bestOffer =
    product.offers.find((o) => o.isBestOpportunity) || product.offers[0];

  const handleAction = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleUseOffer = (offer: ProductMarketplaceOffer) => {
    onPublishOffer?.(product, offer);
    handleAction(
      `Oferta da ${offer.marketplace} selecionada para publicação!`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop Click Dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container (Max-width 860px for ample comparison room) */}
      <div className="w-full max-w-4xl bg-[#070C18] border-l border-[#162340] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Sticky Header */}
        <div className="p-4 sm:p-5 border-b border-[#14203B] bg-[#091021] flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#070C18] border border-[#192747] overflow-hidden shrink-0 flex items-center justify-center p-0.5">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono-numeric text-[11px] font-bold text-[#00C2FF] bg-[#102142] px-2 py-0.5 rounded border border-[#193261]">
                  {product.id}
                </span>
                <span className="text-xs font-semibold text-[#C4CDD8]">
                  {product.brand}
                </span>
                <span className="text-[#64748B]">•</span>
                <span className="text-xs text-[#8E9BAE]">{product.category}</span>
                {product.model && (
                  <>
                    <span className="text-[#64748B]">•</span>
                    <span className="text-xs text-[#8E9BAE] font-mono-numeric">
                      Mod: {product.model}
                    </span>
                  </>
                )}
              </div>

              <h2 className="text-sm sm:text-base font-bold text-[#E6E8EC] leading-snug line-clamp-2">
                {product.name}
              </h2>

              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                {product.marketplaces.map((mp) => (
                  <MarketplaceBadge key={mp} marketplace={mp} size="xs" />
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8E9BAE] hover:text-[#E6E8EC] hover:bg-[#121C33] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Temporary Action Toast Notification */}
        {actionNotice && (
          <div className="bg-[#10244C] border-b border-[#1E5EFF]/40 px-4 py-2 text-xs font-semibold text-[#00C2FF] flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {actionNotice}
            </span>
            <button
              onClick={() => setActionNotice(null)}
              className="text-[#8E9BAE] hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Section: Deduplicação / Nomes Mapeados nos Marketplaces */}
          {product.mappedTitles && product.mappedTitles.length > 0 && (
            <div className="rounded-xl border border-[#162340] bg-[#091122] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowMappedTitles(!showMappedTitles)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-[#0E182F] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00C2FF]" />
                  <span className="text-xs font-bold text-[#E6E8EC]">
                    Deduplicação Inteligente: Nomes Mapeados nos Marketplaces ({product.mappedTitles.length})
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#8E9BAE]">
                  <span>{showMappedTitles ? 'Ocultar' : 'Ver títulos originais'}</span>
                  {showMappedTitles ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </div>
              </button>

              {showMappedTitles && (
                <div className="p-3 pt-0 border-t border-[#131F38] space-y-2 mt-2">
                  <p className="text-[11px] text-[#8E9BAE]">
                    O motor DOMNEX DEALS unificou os títulos abaixo em um único produto consolidado:
                  </p>
                  <div className="space-y-1.5">
                    {product.mappedTitles.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-[#060B16] border border-[#14203B] flex items-start gap-2.5 text-xs"
                      >
                        <div className="shrink-0 mt-0.5">
                          <MarketplaceBadge
                            marketplace={item.marketplace}
                            size="xs"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[#C8D3E0] font-medium text-[11px] leading-snug">
                            "{item.title}"
                          </p>
                          {item.externalId && (
                            <span className="text-[10px] text-[#64748B] font-mono-numeric">
                              ID: {item.externalId}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section: 8 Metric Summary Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. Ofertas ativas */}
            <div className="p-3 rounded-xl bg-[#080E1C] border border-[#162340]">
              <span className="text-[10px] uppercase font-bold text-[#8E9BAE] tracking-wider block">
                Ofertas Ativas
              </span>
              <span className="text-base font-bold font-mono-numeric text-[#38BDF8] block mt-1">
                {product.activeOffersCount}
              </span>
            </div>

            {/* 2. Marketplaces */}
            <div className="p-3 rounded-xl bg-[#080E1C] border border-[#162340]">
              <span className="text-[10px] uppercase font-bold text-[#8E9BAE] tracking-wider block">
                Canais Conectados
              </span>
              <span className="text-base font-bold font-mono-numeric text-[#E6E8EC] block mt-1">
                {product.marketplaces.length}
              </span>
            </div>

            {/* 3. Melhor Preço */}
            <div className="p-3 rounded-xl bg-[#080E1C] border border-[#162340]">
              <span className="text-[10px] uppercase font-bold text-[#8E9BAE] tracking-wider block">
                Melhor Preço
              </span>
              <div className="mt-1">
                <span className="text-base font-bold font-mono-numeric text-emerald-400 block leading-tight">
                  {formatCurrency(product.bestPrice.amount)}
                </span>
                <span className="text-[10px] text-[#8E9BAE]">
                  via {product.bestPrice.marketplace}
                </span>
              </div>
            </div>

            {/* 4. Melhor Deal Score */}
            <div className="p-3 rounded-xl bg-[#080E1C] border border-[#162340]">
              <span className="text-[10px] uppercase font-bold text-[#8E9BAE] tracking-wider block">
                Melhor Deal Score
              </span>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-base font-bold font-mono-numeric text-[#00C2FF]">
                  {product.bestScore.score.total} pts
                </span>
                <span className="text-[10px] text-[#8E9BAE]">
                  via {product.bestScore.marketplace}
                </span>
              </div>
            </div>

            {/* 5. Publicações */}
            <div className="p-3 rounded-xl bg-[#080E1C] border border-[#162340]">
              <span className="text-[10px] uppercase font-bold text-[#8E9BAE] tracking-wider block">
                Publicações
              </span>
              <span className="text-base font-bold font-mono-numeric text-[#E6E8EC] block mt-1">
                {product.publications}
              </span>
            </div>

            {/* 6. Cliques */}
            <div className="p-3 rounded-xl bg-[#080E1C] border border-[#162340]">
              <span className="text-[10px] uppercase font-bold text-[#8E9BAE] tracking-wider block">
                Cliques Totais
              </span>
              <span className="text-base font-bold font-mono-numeric text-[#E6E8EC] block mt-1">
                {product.clicks.toLocaleString('pt-BR')}
              </span>
            </div>

            {/* 7. Pedidos */}
            <div className="p-3 rounded-xl bg-[#080E1C] border border-[#162340]">
              <span className="text-[10px] uppercase font-bold text-[#8E9BAE] tracking-wider block">
                Pedidos Gerados
              </span>
              <span className="text-base font-bold font-mono-numeric text-[#38BDF8] block mt-1">
                {product.orders.toLocaleString('pt-BR')}
              </span>
            </div>

            {/* 8. Comissão Gerada */}
            <div className="p-3 rounded-xl bg-[#080E1C] border border-[#162340]">
              <span className="text-[10px] uppercase font-bold text-[#8E9BAE] tracking-wider block">
                Comissão Gerada
              </span>
              <span className="text-base font-bold font-mono-numeric text-emerald-400 block mt-1">
                {formatCurrency(product.commissionGenerated)}
              </span>
            </div>
          </div>

          {/* Section: AI Insight Box */}
          {product.aiInsight && (
            <ProductInsightBox insightText={product.aiInsight} />
          )}

          {/* Section: Interactive Tabs Switcher */}
          <div className="flex items-center gap-2 border-b border-[#14203B] pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('comparador')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'comparador'
                  ? 'bg-[#15254A] text-[#00C2FF] border border-[#1E5EFF]/40'
                  : 'text-[#8E9BAE] hover:text-[#E6E8EC]'
              }`}
            >
              Comparador de Ofertas ({product.offers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('historico')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'historico'
                  ? 'bg-[#15254A] text-[#00C2FF] border border-[#1E5EFF]/40'
                  : 'text-[#8E9BAE] hover:text-[#E6E8EC]'
              }`}
            >
              Histórico de Preço
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('publicacoes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'publicacoes'
                  ? 'bg-[#15254A] text-[#00C2FF] border border-[#1E5EFF]/40'
                  : 'text-[#8E9BAE] hover:text-[#E6E8EC]'
              }`}
            >
              Histórico de Publicações ({product.publicationHistory.length})
            </button>
          </div>

          {/* Tab 1: Comparador de Ofertas */}
          {activeTab === 'comparador' && (
            <OfferComparisonTable
              offers={product.offers}
              productName={product.name}
              onUseOffer={handleUseOffer}
            />
          )}

          {/* Tab 2: Histórico de Preço */}
          {activeTab === 'historico' && (
            <PriceHistorySection
              historySeries={product.priceHistory}
              productName={product.name}
            />
          )}

          {/* Tab 3: Histórico de Publicações */}
          {activeTab === 'publicacoes' && (
            <PublicationHistorySection
              publications={product.publicationHistory}
              productName={product.name}
            />
          )}
        </div>

        {/* Sticky Footer Quick Actions */}
        <div className="p-4 border-t border-[#14203B] bg-[#091021] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {bestOffer && bestOffer.affiliateLink && (
              <a
                href={bestOffer.affiliateLink}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#00C2FF] hover:underline"
              >
                <span>Ver melhor oferta ({bestOffer.marketplace})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onScheduleOffer?.(product, bestOffer);
                handleAction('Agendamento preparado para canais configurados.');
              }}
              leftIcon={<Calendar className="w-3.5 h-3.5 text-[#8E9BAE]" />}
              className="text-xs text-[#E6E8EC] border-[#182747]"
            >
              Agendar
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onPublishOffer?.(product, bestOffer);
                handleAction(
                  `Oferta selecionada (${bestOffer.marketplace}) enviada para publicação!`
                );
              }}
              leftIcon={<Send className="w-3.5 h-3.5 text-white" />}
              className="text-xs font-semibold px-4"
            >
              Publicar melhor oferta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
