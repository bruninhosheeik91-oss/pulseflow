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
    <div className="bg-[#0A0F1C] border border-[#162340] rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1020px]">
          <thead>
            <tr className="border-b border-[#162340] bg-[#070C18] text-xs font-semibold text-[#8E9BAE] uppercase tracking-wider">
              {/* Checkbox Header */}
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={onToggleSelectAll}
                  className="w-4 h-4 rounded bg-[#0A1020] border-[#1E3057] text-[#1E5EFF] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#1E5EFF]"
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
          <tbody className="divide-y divide-[#131D33] text-xs">
            {offers.map((offer) => {
              const isSelected = selectedIds.includes(offer.id);
              const isMenuOpen = activeMenuId === offer.id;

              return (
                <tr
                  key={offer.id}
                  className={`group transition-colors duration-100 ${
                    isSelected
                      ? 'bg-[#101E3D]/40 hover:bg-[#122347]/50'
                      : 'hover:bg-[#0E172E]'
                  }`}
                >
                  {/* Row Checkbox */}
                  <td className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(offer.id)}
                      className="w-4 h-4 rounded bg-[#0A1020] border-[#1E3057] text-[#1E5EFF] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#1E5EFF]"
                    />
                  </td>

                  {/* Produto Column: Image + Name + Marketplace + Category + Store */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        onClick={() => onViewOffer(offer)}
                        className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#0A1020] border border-[#182647] shrink-0 cursor-pointer group/img hover:border-[#00C2FF] transition-colors"
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
                          className="font-semibold text-xs text-[#E6E8EC] hover:text-[#00C2FF] cursor-pointer transition-colors leading-tight line-clamp-1"
                        >
                          {offer.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-[#8E9BAE] mt-1 flex-wrap">
                          <MarketplaceBadge marketplace={offer.marketplace} size="sm" />
                          <span className="text-[#5A6470]">•</span>
                          <span className="truncate max-w-[105px]">
                            {offer.category}
                          </span>
                          <span className="text-[#5A6470]">•</span>
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
                      <span className="font-mono-numeric font-bold text-xs text-[#E6E8EC] mt-0.5">
                        Por R$ {offer.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </td>

                  {/* Desconto */}
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono-numeric font-semibold text-xs">
                      -{offer.discountPercentage}%
                    </span>
                  </td>

                  {/* Avaliação */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex items-center gap-1 font-mono-numeric font-medium text-xs text-amber-300">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                      <span>{offer.rating.toFixed(1).replace('.', ',')}</span>
                    </div>
                  </td>

                  {/* Vendas */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-mono-numeric text-xs text-[#C8D1DE]">
                      {offer.salesVolume}
                    </span>
                  </td>

                  {/* Comissão */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex flex-col items-end leading-tight">
                      <span className="font-mono-numeric font-semibold text-xs text-emerald-400">
                        R$ {offer.commissionAmount.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[11px] font-mono-numeric text-[#8E9BAE]">
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
                  <td className="py-3 px-3 text-center text-xs text-[#8E9BAE] font-mono-numeric whitespace-nowrap">
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
                          leftIcon={<CheckCircle2 className="w-3 h-3 text-emerald-400" />}
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
                          leftIcon={<Eye className="w-3 h-3 text-[#8E9BAE]" />}
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
                          className="h-7 text-xs text-[#8E9BAE] hover:text-[#00C2FF]"
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
                            ? 'bg-[#152345] border-[#1E5EFF] text-white'
                            : 'bg-transparent border-transparent text-[#8E9BAE] hover:text-[#E6E8EC] hover:bg-[#121E38]'
                        }`}
                        title="Mais opções"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-full mt-1 w-44 bg-[#0E172C] border border-[#1E3057] rounded-xl shadow-2xl shadow-black/80 py-1.5 z-30 text-left animate-in fade-in zoom-in-95 duration-100"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onViewOffer(offer);
                            }}
                            className="w-full px-3 py-1.5 text-xs text-[#E6E8EC] hover:bg-[#152345] flex items-center gap-2 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#00C2FF]" />
                            <span>Visualizar detalhes</span>
                          </button>

                          {offer.status !== 'Aprovada' && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onApproveOffer(offer.id);
                              }}
                              className="w-full px-3 py-1.5 text-xs text-[#E6E8EC] hover:bg-[#152345] flex items-center gap-2 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Aprovar oferta</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onPublishOffer(offer);
                            }}
                            className="w-full px-3 py-1.5 text-xs text-[#E6E8EC] hover:bg-[#152345] flex items-center gap-2 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5 text-[#00C2FF]" />
                            <span>Publicar agora</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onScheduleOffer(offer);
                            }}
                            className="w-full px-3 py-1.5 text-xs text-[#E6E8EC] hover:bg-[#152345] flex items-center gap-2 transition-colors"
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
                            className="w-full px-3 py-1.5 text-xs text-[#E6E8EC] hover:bg-[#152345] flex items-center gap-2 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5 text-[#8E9BAE]" />
                            <span>Copiar link</span>
                          </button>

                          {offer.status !== 'Rejeitada' && (
                            <div className="pt-1 mt-1 border-t border-[#182745]">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onRejectOffer(offer);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
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
