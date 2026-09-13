import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  CheckCircle2,
  Send,
  Clock,
  Eye,
  XCircle,
  Copy,
  Star,
} from 'lucide-react';
import { ProductOffer } from '../../types';
import { OfferScoreBadge } from './OfferScoreBadge';
import { OfferStatusBadge } from './OfferStatusBadge';
import { MarketplaceBadge } from '../ui/MarketplaceBadge';
import { Button } from '../ui/Button';

interface OffersGridProps {
  offers: ProductOffer[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onViewOffer: (offer: ProductOffer) => void;
  onApproveOffer: (id: string) => void;
  onPublishOffer: (offer: ProductOffer) => void;
  onScheduleOffer: (offer: ProductOffer) => void;
  onRejectOffer: (offer: ProductOffer) => void;
  onCopyLink: (link: string) => void;
}

export const OffersGrid: React.FC<OffersGridProps> = ({
  offers,
  selectedIds,
  onToggleSelect,
  onViewOffer,
  onApproveOffer,
  onPublishOffer,
  onScheduleOffer,
  onRejectOffer,
  onCopyLink,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {offers.map((offer) => {
        const isSelected = selectedIds.includes(offer.id);
        const isMenuOpen = activeMenuId === offer.id;

        return (
          <div
            key={offer.id}
            className={`bg-[#F4F7FB] border rounded-xl overflow-hidden transition-all duration-150 flex flex-col justify-between group relative ${
              isSelected
                ? 'border-[#2563EB] shadow-md shadow-[#2563EB]/10 bg-[#F1F5F9]'
                : 'border-[#E2E8F0] hover:border-[#E2E8F0] hover:bg-[#F8FAFC]'
            }`}
          >
            {/* Top Toolbar on Card: Checkbox + Status + Menu */}
            <div className="p-3 pb-0 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(offer.id)}
                  className="w-4 h-4 rounded bg-[#F8FAFC] border-[#BFDBFE] text-[#2563EB] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#2563EB]"
                />
                <span className="text-[11px] font-mono-numeric text-[#64748B]">
                  {offer.foundAt}
                </span>
              </div>
              <OfferStatusBadge status={offer.status} size="sm" />
            </div>

            {/* Product Body: Image & Info */}
            <div className="p-3 space-y-3">
              <div className="flex gap-3 items-start">
                <div
                  onClick={() => onViewOffer(offer)}
                  className="w-16 h-16 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] overflow-hidden shrink-0 cursor-pointer hover:border-[#2563EB] transition-colors"
                >
                  <img
                    src={offer.imageUrl}
                    alt={offer.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MarketplaceBadge marketplace={offer.marketplace} size="sm" />
                  </div>
                  <span className="text-[11px] text-[#64748B] block truncate">
                    {offer.category} • {offer.storeName}
                  </span>
                  <h4
                    onClick={() => onViewOffer(offer)}
                    title={offer.name}
                    className="text-xs font-semibold text-[#172033] hover:text-[#2563EB] cursor-pointer transition-colors line-clamp-2 leading-snug mt-0.5"
                  >
                    {offer.name}
                  </h4>
                </div>
              </div>

              {/* Price & Discount */}
              <div className="flex items-baseline justify-between pt-1 border-t border-[#F1F5F9]">
                <div>
                  <span className="text-[11px] font-mono-numeric text-[#64748B] line-through block">
                    De R$ {offer.originalPrice.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-sm font-bold font-mono-numeric text-[#172033]">
                    Por R$ {offer.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 font-mono-numeric font-semibold text-xs">
                  -{offer.discountPercentage}%
                </span>
              </div>

              {/* Metrics: Rating, Sales, Commission */}
              <div className="grid grid-cols-3 gap-1.5 p-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-center text-xs">
                <div>
                  <span className="text-[10px] text-[#64748B] block">Avaliação</span>
                  <div className="flex items-center justify-center gap-0.5 font-mono-numeric font-semibold text-amber-700 text-xs mt-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-700" />
                    <span>{offer.rating.toFixed(1).replace('.', ',')}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block">Vendas</span>
                  <span className="font-mono-numeric font-semibold text-[#334155] text-xs mt-0.5 block">
                    {offer.salesVolume}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block">Comissão</span>
                  <span className="font-mono-numeric font-semibold text-emerald-700 text-xs mt-0.5 block">
                    R$ {offer.commissionAmount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Deal Score Display */}
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg">
                <span className="text-xs text-[#64748B] font-medium">
                  Deal Score
                </span>
                <OfferScoreBadge score={offer.score} size="sm" />
              </div>
            </div>

            {/* Bottom Actions on Card */}
            <div className="p-3 pt-0 flex items-center justify-between gap-2 relative">
              <div className="flex-1">
                {offer.status === 'Em análise' && (
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => onApproveOffer(offer.id)}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                    className="w-full text-xs hover:border-emerald-500/40"
                  >
                    Aprovar
                  </Button>
                )}

                {offer.status === 'Aprovada' && (
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={() => onPublishOffer(offer)}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                    className="w-full text-xs font-semibold"
                  >
                    Publicar
                  </Button>
                )}

                {(offer.status === 'Publicada' ||
                  offer.status === 'Agendada') && (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => onViewOffer(offer)}
                    leftIcon={<Eye className="w-3.5 h-3.5 text-[#64748B]" />}
                    className="w-full text-xs"
                  >
                    Visualizar
                  </Button>
                )}

                {offer.status === 'Rejeitada' && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => onApproveOffer(offer.id)}
                    className="w-full text-xs text-[#64748B] hover:text-[#2563EB]"
                  >
                    Reavaliar
                  </Button>
                )}
              </div>

              {/* Menu Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(isMenuOpen ? null : offer.id);
                }}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isMenuOpen
                    ? 'bg-[#DBEAFE] border-[#2563EB] text-[#172033]'
                    : 'bg-transparent border-transparent text-[#64748B] hover:text-[#172033] hover:bg-[#EFF6FF]'
                }`}
                title="Mais opções"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {/* Context Menu Dropdown */}
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-3 bottom-full mb-1 w-44 bg-[#FFFFFF] border border-[#BFDBFE] rounded-xl shadow-2xl shadow-black/80 py-1.5 z-30 text-left animate-in fade-in zoom-in-95 duration-100"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuId(null);
                      onViewOffer(offer);
                    }}
                    className="w-full px-3 py-1.5 text-xs text-[#172033] hover:bg-[#DBEAFE] flex items-center gap-2 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Visualizar detalhes</span>
                  </button>

                  {offer.status !== 'Aprovada' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenuId(null);
                        onApproveOffer(offer.id);
                      }}
                      className="w-full px-3 py-1.5 text-xs text-[#172033] hover:bg-[#DBEAFE] flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Aprovar oferta</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuId(null);
                      onPublishOffer(offer);
                    }}
                    className="w-full px-3 py-1.5 text-xs text-[#172033] hover:bg-[#DBEAFE] flex items-center gap-2 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Publicar agora</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuId(null);
                      onScheduleOffer(offer);
                    }}
                    className="w-full px-3 py-1.5 text-xs text-[#172033] hover:bg-[#DBEAFE] flex items-center gap-2 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Agendar publicação</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuId(null);
                      onCopyLink(offer.linkAfiliado);
                    }}
                    className="w-full px-3 py-1.5 text-xs text-[#172033] hover:bg-[#DBEAFE] flex items-center gap-2 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Copiar link</span>
                  </button>

                  {offer.status !== 'Rejeitada' && (
                    <div className="pt-1 mt-1 border-t border-[#DCE3EC]">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          onRejectOffer(offer);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rejeitar oferta</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
