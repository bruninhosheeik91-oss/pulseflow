import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Star,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { ProductOffer } from '../../types';
import { OfferScoreBadge } from './OfferScoreBadge';
import { OfferStatusBadge } from './OfferStatusBadge';
import { MarketplaceBadge } from '../ui/MarketplaceBadge';
import { Button } from '../ui/Button';

interface OfferDetailDrawerProps {
  offer: ProductOffer | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onPublish: (offer: ProductOffer) => void;
  onSchedule: (offer: ProductOffer) => void;
  onReject: (offer: ProductOffer) => void;
  onCopyLink: (link: string) => void;
}

export const OfferDetailDrawer: React.FC<OfferDetailDrawerProps> = ({
  offer,
  isOpen,
  onClose,
  onApprove,
  onPublish,
  onSchedule,
  onReject,
  onCopyLink,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCopy, setCopiedCopy] = useState(false);

  if (!isOpen || !offer) return null;

  const economy = offer.originalPrice - offer.price;

  // Breakdown data (with fallback calculation if not explicitly provided)
  const breakdown = offer.score.breakdown || {
    discount: Math.round((offer.discountPercentage / 70) * 25),
    maxDiscount: 25,
    rating: Math.round((offer.rating / 5) * 20),
    maxRating: 20,
    sales: 14,
    maxSales: 15,
    commission: Math.round((offer.commissionPercentage / 15) * 20),
    maxCommission: 20,
    price: 9,
    maxPrice: 10,
    coupon: 9,
    maxCoupon: 10,
    total: offer.score.total,
    maxTotal: 100,
  };

  const copyText = `🔥 OFERTA ENCONTRADA!

🍳 ${offer.name}

De: R$ ${offer.originalPrice.toFixed(2).replace('.', ',')}
🔥 Por: R$ ${offer.price.toFixed(2).replace('.', ',')}

💥 ${offer.discountPercentage}% OFF
⭐ ${offer.rating.toFixed(1).replace('.', ',')} | +${offer.salesVolume} vendidos

🛒 PEGAR OFERTA 👇
${offer.linkAfiliado}`;

  const handleCopyLink = () => {
    onCopyLink(offer.linkAfiliado);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCopy = () => {
    navigator.clipboard.writeText(copyText);
    setCopiedCopy(true);
    setTimeout(() => setCopiedCopy(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-xl bg-[#F4F7FB] border-l border-[#DCE3EC] h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="h-16 px-6 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-[#FFFFFF]">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-[#172033]">
              Detalhes da oferta
            </h3>
            <OfferStatusBadge status={offer.status} size="sm" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#E2E8F0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Product Main Summary */}
          <div className="flex gap-4 p-4 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#FFFFFF] border border-[#DCE3EC] shrink-0">
              <img
                src={offer.imageUrl}
                alt={offer.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <MarketplaceBadge marketplace={offer.marketplace} size="sm" />
                <span className="text-[#94A3B8]">•</span>
                <span className="text-xs text-[#64748B]">{offer.category}</span>
              </div>
              <h4 className="text-sm font-semibold text-[#172033] leading-snug">
                {offer.name}
              </h4>
              <p className="text-xs text-[#64748B]">
                Loja: <span className="text-[#64748B]">{offer.storeName}</span>
              </p>
            </div>
          </div>

          {/* Section 2: Preço & Economia */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Preço & Economia
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg">
                <span className="text-[11px] text-[#64748B] block">Preço anterior</span>
                <span className="text-xs font-mono-numeric text-[#64748B] line-through mt-0.5 block">
                  R$ {offer.originalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg">
                <span className="text-[11px] text-[#64748B] block">Preço atual</span>
                <span className="text-sm font-bold font-mono-numeric text-[#172033] mt-0.5 block">
                  R$ {offer.price.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg">
                <span className="text-[11px] text-[#64748B] block">Economia</span>
                <span className="text-xs font-bold font-mono-numeric text-emerald-700 mt-0.5 block">
                  R$ {economy.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg">
                <span className="text-[11px] text-[#64748B] block">Desconto</span>
                <span className="text-xs font-bold font-mono-numeric text-[#2563EB] mt-0.5 block">
                  {offer.discountPercentage}% OFF
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Performance do Produto */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Performance do Produto
            </h5>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-center">
                <span className="text-[11px] text-[#64748B] block">Avaliação</span>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-700" />
                  <span className="text-sm font-bold font-mono-numeric text-amber-700">
                    {offer.rating.toFixed(1).replace('.', ',')}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-center">
                <span className="text-[11px] text-[#64748B] block">Avaliações</span>
                <span className="text-sm font-bold font-mono-numeric text-[#172033] mt-1 block">
                  {offer.reviewCount.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-center">
                <span className="text-[11px] text-[#64748B] block">Vendas</span>
                <span className="text-sm font-bold font-mono-numeric text-[#3B82F6] mt-1 block">
                  {offer.salesVolume}+
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Marketplace de Origem & Afiliado */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Marketplace de Origem & Dados de Afiliado
            </h5>
            <div className="p-3.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] text-[#64748B] block mb-1">
                    Marketplace de Origem
                  </span>
                  <MarketplaceBadge marketplace={offer.marketplace} size="md" />
                </div>
                <div>
                  <span className="text-[11px] text-[#64748B] block mb-1">
                    ID Externo
                  </span>
                  <span className="text-xs font-mono-numeric text-[#172033] bg-[#FFFFFF] px-2 py-1 rounded border border-[#DCE3EC] inline-block">
                    {offer.externalId || `${offer.marketplace.slice(0, 3).toUpperCase()}-${offer.id.slice(0, 6)}`}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#64748B] block mb-1">
                    Status Conector
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {offer.affiliateProgramStatus || 'Ativo'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-[#E2E8F0]">
                <div>
                  <span className="text-[11px] text-[#64748B] block">
                    Comissão Estimada
                  </span>
                  <span className="text-base font-bold font-mono-numeric text-emerald-700 mt-0.5 block">
                    R$ {offer.commissionAmount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#64748B] block">Taxa de Comissão</span>
                  <span className="text-base font-bold font-mono-numeric text-[#172033] mt-0.5 block">
                    {offer.commissionPercentage}%
                  </span>
                </div>
              </div>

              {/* Link Box */}
              <div>
                <span className="text-[11px] text-[#64748B] block mb-1">
                  Link de afiliado gerado
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={offer.linkAfiliado}
                    className="flex-1 h-8.5 px-3 bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg text-xs font-mono-numeric text-[#64748B] select-all focus:outline-none"
                  />
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={handleCopyLink}
                    leftIcon={
                      copiedLink ? (
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )
                    }
                    className="h-8.5 shrink-0 text-xs"
                  >
                    {copiedLink ? 'Copiado!' : 'Copiar link'}
                  </Button>
                </div>
              </div>

              {/* Link Original */}
              <div className="pt-1">
                <a
                  href={offer.linkOriginal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#2563EB] hover:underline"
                >
                  <span>Ver anúncio original no {offer.marketplace}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Section 5: Deal Score & Breakdown */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                Deal Score & Critérios do Motor
              </h5>
            </div>

            <OfferScoreBadge score={offer.score} size="lg" />

            {/* Breakdown Bars */}
            <div className="p-3.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl space-y-2.5">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#64748B]">Desconto</span>
                  <span className="font-mono-numeric font-semibold text-[#172033]">
                    {breakdown.discount} / {breakdown.maxDiscount}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#FFFFFF] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2563EB] rounded-full"
                    style={{
                      width: `${(breakdown.discount / breakdown.maxDiscount) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#64748B]">Avaliação</span>
                  <span className="font-mono-numeric font-semibold text-[#172033]">
                    {breakdown.rating} / {breakdown.maxRating}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#FFFFFF] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2563EB] rounded-full"
                    style={{
                      width: `${(breakdown.rating / breakdown.maxRating) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#64748B]">Vendas</span>
                  <span className="font-mono-numeric font-semibold text-[#172033]">
                    {breakdown.sales} / {breakdown.maxSales}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#FFFFFF] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3B82F6] rounded-full"
                    style={{
                      width: `${(breakdown.sales / breakdown.maxSales) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#64748B]">Comissão</span>
                  <span className="font-mono-numeric font-semibold text-[#172033]">
                    {breakdown.commission} / {breakdown.maxCommission}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#FFFFFF] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{
                      width: `${(breakdown.commission / breakdown.maxCommission) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#64748B]">Preço</span>
                  <span className="font-mono-numeric font-semibold text-[#172033]">
                    {breakdown.price} / {breakdown.maxPrice}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#FFFFFF] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 rounded-full"
                    style={{
                      width: `${(breakdown.price / breakdown.maxPrice) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#64748B]">Oferta / Cupom</span>
                  <span className="font-mono-numeric font-semibold text-[#172033]">
                    {breakdown.coupon} / {breakdown.maxCoupon}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#FFFFFF] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{
                      width: `${(breakdown.coupon / breakdown.maxCoupon) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                <span className="font-bold text-[#172033]">Total Calculado</span>
                <span className="font-mono-numeric font-bold text-[#2563EB]">
                  {breakdown.total} / {breakdown.maxTotal}
                </span>
              </div>
            </div>
          </div>

          {/* Section 6: Copy de Publicação (Prévia da Publicação) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                Prévia da Publicação
              </h5>
              <Button
                size="xs"
                variant="ghost"
                onClick={handleCopyCopy}
                leftIcon={
                  copiedCopy ? (
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#2563EB]" />
                  )
                }
                className="text-xs text-[#2563EB]"
              >
                {copiedCopy ? 'Texto copiado!' : 'Copiar texto'}
              </Button>
            </div>

            <div className="p-3.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl text-xs font-sans text-[#172033] whitespace-pre-wrap leading-relaxed select-all">
              {copyText}
            </div>
          </div>
        </div>

        {/* Sticky Drawer Footer with Operational Actions */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#FFFFFF] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            {offer.status !== 'Aprovada' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onApprove(offer.id)}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                className="text-xs"
              >
                Aprovar
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onSchedule(offer)}
              leftIcon={<Clock className="w-3.5 h-3.5 text-indigo-400" />}
              className="text-xs"
            >
              Agendar
            </Button>

            {offer.status !== 'Rejeitada' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReject(offer)}
                leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-700" />}
                className="text-xs text-rose-700 hover:bg-rose-500/10"
              >
                Rejeitar
              </Button>
            )}
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onPublish(offer)}
            leftIcon={<Send className="w-3.5 h-3.5" />}
            className="text-xs font-semibold px-5 shadow-sm shadow-[#2563EB]/30"
          >
            Publicar oferta
          </Button>
        </div>
      </div>
    </div>
  );
};
