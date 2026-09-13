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
  ExternalLink,
} from 'lucide-react';
import { ProductOffer } from '../../types';
import { OfferScoreBadge } from './OfferScoreBadge';
import { OfferStatusBadge } from './OfferStatusBadge';
import { MarketplaceBadge } from '../ui/MarketplaceBadge';
import { Button } from '../ui/Button';

interface OffersTableProps {
  offers: ProductOffer[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onViewOffer: (offer: ProductOffer) => void;
  onApproveOffer: (id: string) => void;
  onPublishOffer: (offer: ProductOffer) => void;
  onScheduleOffer: (offer: ProductOffer) => void;
  onRejectOffer: (offer: ProductOffer) => void;
  onCopyLink: (link: string) => void;
}

export const OffersTable: React.FC<OffersTableProps> = ({
  offers,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onViewOffer,
  onApproveOffer,
  onPublishOffer,
  onScheduleOffer,
  onRejectOffer,
  onCopyLink,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const allSelected =
    offers.length > 0 && offers.every((o) => selectedIds.includes(o.id));
  const someSelected =
    offers.some((o) => selectedIds.includes(o.id)) && !allSelected;

  return (
    <div className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1020px]">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#FFFFFF] text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              {/* Checkbox Header */}
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={onToggleSelectAll}
                  className="w-4 h-4 rounded bg-[#F8FAFC] border-[#BFDBFE] text-[#2563EB] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#2563EB]"
                />
              </th>
              <th className="py-3 px-4 min-w-[280px]">Produto</th>
              <th className="py-3 px-3 text-right">Preço</th>
              <th className="py-3 px-3 text-center">Desconto</th>
              <th className="py-3 px-3 text-center">Avaliação</th>
              <th className="py-3 px-3 text-center">Vendas</th>
              <th className="py-3 px-3 text-right">Comissão</th>
              <th className="py-3 px-3 text-center">Deal Score</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3 text-center">Encontrada</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9] text-xs">
            {offers.map((offer) => {
              const isSelected = selectedIds.includes(offer.id);
              const isMenuOpen = activeMenuId === offer.id;

              return (
                <tr
                  key={offer.id}
                  className={`group transition-colors duration-100 ${
                    isSelected
                      ? 'bg-[#F8FAFC]/40 hover:bg-[#F8FAFC]/50'
                      : 'hover:bg-[#F1F5F9]'
                  }`}
                >
                  {/* Row Checkbox */}
                  <td className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(offer.id)}
                      className="w-4 h-4 rounded bg-[#F8FAFC] border-[#BFDBFE] text-[#2563EB] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#2563EB]"
                    />
                  </td>

                  {/* Produto Column: Image + Name + Marketplace + Category + Store */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        onClick={() => onViewOffer(offer)}
                        className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#F8FAFC] border border-[#DCE3EC] shrink-0 cursor-pointer group/img hover:border-[#2563EB] transition-colors"
                      >
                        <img
                          src={offer.imageUrl}
                          alt={offer.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          onClick={() => onViewOffer(offer)}
                          title={offer.name}
                          className="font-semibold text-xs text-[#172033] hover:text-[#2563EB] cursor-pointer transition-colors leading-tight line-clamp-1"
                        >
                          {offer.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1 flex-wrap">
                          <MarketplaceBadge marketplace={offer.marketplace} size="sm" />
                          <span className="text-[#94A3B8]">•</span>
                          <span className="truncate max-w-[105px]">
                            {offer.category}
                          </span>
                          <span className="text-[#94A3B8]">•</span>
                          <span className="truncate text-[#64748B] max-w-[110px]" title={offer.storeName}>
                            {offer.storeName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Preço: Original riscado discreto + Atual com destaque */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex flex-col items-end leading-tight">
                      <span className="text-[11px] font-mono-numeric text-[#64748B] line-through">
                        De R$ {offer.originalPrice.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="font-mono-numeric font-bold text-xs text-[#172033] mt-0.5">
                        Por R$ {offer.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </td>

                  {/* Desconto */}
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 font-mono-numeric font-semibold text-xs">
                      -{offer.discountPercentage}%
                    </span>
                  </td>

                  {/* Avaliação */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex items-center gap-1 font-mono-numeric font-medium text-xs text-amber-700">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-700 shrink-0" />
                      <span>{offer.rating.toFixed(1).replace('.', ',')}</span>
                    </div>
                  </td>

                  {/* Vendas */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-mono-numeric text-xs text-[#334155]">
                      {offer.salesVolume}
                    </span>
                  </td>

                  {/* Comissão */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex flex-col items-end leading-tight">
                      <span className="font-mono-numeric font-semibold text-xs text-emerald-700">
                        R$ {offer.commissionAmount.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[11px] font-mono-numeric text-[#64748B]">
                        ({offer.commissionPercentage}%)
                      </span>
                    </div>
                  </td>

                  {/* Deal Score */}
                  <td className="py-3 px-3 text-center">
                    <OfferScoreBadge score={offer.score} size="sm" />
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 text-center">
                    <OfferStatusBadge status={offer.status} size="sm" />
                  </td>

                  {/* Encontrada */}
                  <td className="py-3 px-3 text-center text-xs text-[#64748B] font-mono-numeric whitespace-nowrap">
                    {offer.foundAt}
                  </td>

                  {/* Ações: contextual + [...] menu */}
                  <td className="py-3 px-4 text-right">
                    <div className="relative inline-flex items-center justify-end gap-1.5">
                      {/* Contextual Primary Action Button */}
                      {offer.status === 'Em análise' && (
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => onApproveOffer(offer.id)}
                          leftIcon={<CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                          className="h-7 text-xs hover:border-emerald-500/40"
                        >
                          Aprovar
                        </Button>
                      )}

                      {offer.status === 'Aprovada' && (
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={() => onPublishOffer(offer)}
                          leftIcon={<Send className="w-3 h-3" />}
                          className="h-7 text-xs font-semibold"
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
                          leftIcon={<Eye className="w-3 h-3 text-[#64748B]" />}
                          className="h-7 text-xs"
                        >
                          Visualizar
                        </Button>
                      )}

                      {offer.status === 'Rejeitada' && (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => onApproveOffer(offer.id)}
                          className="h-7 text-xs text-[#64748B] hover:text-[#2563EB]"
                        >
                          Reavaliar
                        </Button>
                      )}

                      {/* Menu de Três Pontos [...] */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(isMenuOpen ? null : offer.id);
                        }}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isMenuOpen
                            ? 'bg-[#DBEAFE] border-[#2563EB] text-white'
                            : 'bg-transparent border-transparent text-[#64748B] hover:text-[#172033] hover:bg-[#EFF6FF]'
                        }`}
                        title="Mais opções"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-full mt-1 w-44 bg-[#FFFFFF] border border-[#BFDBFE] rounded-xl shadow-2xl shadow-black/80 py-1.5 z-30 text-left animate-in fade-in zoom-in-95 duration-100"
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
