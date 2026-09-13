import React, { useState } from 'react';
import {
  Sparkles,
  ExternalLink,
  Star,
  Copy,
  Check,
  Send,
  Info,
} from 'lucide-react';
import { ProductMarketplaceOffer } from '../../types';
import { MarketplaceBadge } from '../ui/MarketplaceBadge';
import { OfferScoreBadge } from '../offers/OfferScoreBadge';
import { Button } from '../ui/Button';

interface OfferComparisonTableProps {
  offers: ProductMarketplaceOffer[];
  productName: string;
  onUseOffer?: (offer: ProductMarketplaceOffer) => void;
}

export const OfferComparisonTable: React.FC<OfferComparisonTableProps> = ({
  offers,
  productName,
  onUseOffer,
}) => {
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);

  const formatCurrency = (val: number | null) => {
    if (val === null || val === undefined) return '—';
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleCopyCoupon = (coupon: string, offerId: string) => {
    navigator.clipboard.writeText(coupon);
    setCopiedCouponId(offerId);
    setTimeout(() => setCopiedCouponId(null), 2000);
  };

  const bestOffer = offers.find((o) => o.isBestOpportunity);

  return (
    <div className="space-y-3">
      {/* Header with Title & Best Opportunity Highlight Notice */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-[#172033]">
            Comparador de Ofertas Multimarketplace
          </h4>
          <p className="text-[11px] text-[#64748B]">
            {offers.length}{' '}
            {offers.length === 1
              ? 'oferta rastreada em tempo real'
              : 'ofertas rastreadas em tempo real'}
          </p>
        </div>

        {bestOffer && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/40 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Melhor Oportunidade Identificada</span>
          </span>
        )}
      </div>

      {/* Optional Best Opportunity Justification banner if present */}
      {bestOffer && bestOffer.bestOpportunityReason && (
        <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs flex items-start gap-2 text-[#C6D4E7]">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#2563EB] mr-1">
              {bestOffer.marketplace}:
            </span>
            <span>{bestOffer.bestOpportunityReason}</span>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 min-w-[140px]">Marketplace</th>
                <th className="py-2.5 px-3 min-w-[130px]">Loja</th>
                <th className="py-2.5 px-3 min-w-[110px]">Preço</th>
                <th className="py-2.5 px-3 min-w-[90px]">Desconto</th>
                <th className="py-2.5 px-3 min-w-[130px]">Comissão</th>
                <th className="py-2.5 px-3 min-w-[90px]">Avaliação</th>
                <th className="py-2.5 px-3 min-w-[90px]">Vendas</th>
                <th className="py-2.5 px-3 min-w-[120px]">Deal Score</th>
                <th className="py-2.5 px-3 min-w-[90px]">Atualizado</th>
                <th className="py-2.5 px-3 text-right min-w-[110px]">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF6FF]">
              {offers.map((offer) => {
                const isBest = offer.isBestOpportunity;
                return (
                  <tr
                    key={offer.id}
                    className={`transition-colors ${
                      isBest
                        ? 'bg-[#EFF6FF]/60 hover:bg-[#F8FAFC]/70 border-l-2 border-l-[#2563EB]'
                        : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {/* Marketplace Badge + Best Opportunity Tag */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-1">
                        <MarketplaceBadge
                          marketplace={offer.marketplace}
                          size="sm"
                        />
                        {isBest && (
                          <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-[#2563EB] font-mono-numeric">
                            ★ MELHOR OPÇÃO
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Loja */}
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-[#172033] block truncate max-w-[120px]">
                        {offer.storeName}
                      </span>
                      {offer.coupon && (
                        <button
                          type="button"
                          onClick={() => handleCopyCoupon(offer.coupon!, offer.id)}
                          className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-mono-numeric text-[#3B82F6] hover:text-[#2563EB] bg-[#F8FAFC] px-1.5 py-0.5 rounded border border-[#E2E8F0] transition-colors"
                          title="Clique para copiar cupom"
                        >
                          {copiedCouponId === offer.id ? (
                            <Check className="w-2.5 h-2.5 text-emerald-700" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                          <span>{offer.coupon}</span>
                        </button>
                      )}
                    </td>

                    {/* Preço */}
                    <td className="py-2.5 px-3">
                      <div>
                        <span
                          className={`font-bold font-mono-numeric text-xs ${
                            isBest ? 'text-[#2563EB]' : 'text-[#172033]'
                          }`}
                        >
                          {formatCurrency(offer.price)}
                        </span>
                        {offer.originalPrice > offer.price && (
                          <span className="text-[10px] text-[#64748B] line-through block font-mono-numeric">
                            {formatCurrency(offer.originalPrice)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Desconto */}
                    <td className="py-2.5 px-3">
                      {offer.discountPercentage > 0 ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-mono-numeric font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
                          {offer.discountPercentage}% off
                        </span>
                      ) : (
                        <span className="text-xs text-[#64748B]">—</span>
                      )}
                    </td>

                    {/* Comissão */}
                    <td className="py-2.5 px-3">
                      {offer.commissionAmount !== null &&
                      offer.commissionPercentage !== null ? (
                        <div>
                          <span className="font-bold font-mono-numeric text-xs text-emerald-700">
                            {formatCurrency(offer.commissionAmount)}
                          </span>
                          <span className="text-[10px] text-[#64748B] block font-mono-numeric">
                            ({offer.commissionPercentage}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#64748B] italic">
                          Não disponível
                        </span>
                      )}
                    </td>

                    {/* Avaliação */}
                    <td className="py-2.5 px-3">
                      {offer.rating ? (
                        <div className="flex items-center gap-1 font-mono-numeric text-xs text-[#172033]">
                          <Star className="w-3 h-3 text-amber-700 fill-amber-400 shrink-0" />
                          <span>{offer.rating.toFixed(1)}</span>
                          {offer.reviewCount && (
                            <span className="text-[10px] text-[#64748B]">
                              ({offer.reviewCount})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[#64748B]">—</span>
                      )}
                    </td>

                    {/* Vendas */}
                    <td className="py-2.5 px-3">
                      {offer.salesVolume ? (
                        <span className="font-mono-numeric text-xs text-[#475569]">
                          {offer.salesVolume}
                        </span>
                      ) : (
                        <span className="text-xs text-[#64748B]">—</span>
                      )}
                    </td>

                    {/* Deal Score */}
                    <td className="py-2.5 px-3">
                      {offer.score.total > 0 ? (
                        <OfferScoreBadge score={offer.score} size="sm" />
                      ) : (
                        <span className="text-xs text-[#64748B]">—</span>
                      )}
                    </td>

                    {/* Atualizado */}
                    <td className="py-2.5 px-3 text-[11px] text-[#64748B] font-mono-numeric whitespace-nowrap">
                      {offer.updatedAt}
                    </td>

                    {/* Ação */}
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        variant={isBest ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => onUseOffer?.(offer)}
                        className={`h-7 px-2.5 text-xs font-semibold ${
                          isBest
                            ? 'bg-[#2563EB] hover:bg-[#F8FAFC] text-white shadow-xs'
                            : 'border-[#CBD5E1] hover:border-[#E2E8F0] text-[#172033]'
                        }`}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        <span>Usar oferta</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
