import React, { useState, useMemo } from 'react';
import {
  Eye,
  Check,
  XCircle,
  Send,
  Star,
  Filter,
  ExternalLink,
} from 'lucide-react';
import { ProductOffer, DealStatus } from '../../types';
import { Badge } from '../ui/Badge';
import { MarketplaceBadge } from '../ui/MarketplaceBadge';
import { Select } from '../ui/Select';

interface BestDealsTableProps {
  offers: ProductOffer[];
  onViewOffer: (offer: ProductOffer) => void;
  onApproveOffer: (offerId: string) => void;
  onRejectOffer?: (offerId: string) => void;
  onPublishOffer: (offer: ProductOffer) => void;
  searchFilter: string;
}

export const BestDealsTable: React.FC<BestDealsTableProps> = ({
  offers,
  onViewOffer,
  onApproveOffer,
  onRejectOffer,
  onPublishOffer,
  searchFilter,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const matchesSearch =
        !searchFilter ||
        offer.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        offer.category.toLowerCase().includes(searchFilter.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || offer.category === selectedCategory;

      const matchesStatus =
        selectedStatus === 'all' || offer.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [offers, searchFilter, selectedCategory, selectedStatus]);

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const statusOptions = [
    { value: 'all', label: 'Status: Todos' },
    { value: 'Aprovada', label: 'Aprovadas' },
    { value: 'Em análise', label: 'Em análise' },
    { value: 'Rejeitada', label: 'Rejeitadas' },
  ];

  return (
    <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl overflow-hidden">
      {/* Table Header & Quick Filters */}
      <div className="p-5 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-[#172033] tracking-tight">
              Melhores ofertas encontradas
            </h2>
            <span className="text-xs font-mono-numeric font-medium px-2.5 py-0.5 rounded-full bg-[#E2E8F0] text-[#2563EB] border border-[#BFDBFE]">
              {filteredOffers.length}{' '}
              {filteredOffers.length === 1 ? 'oferta' : 'ofertas'}
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Produtos com maior potencial segundo o Deal Score
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-lg border border-[#DCE3EC]">
            <span className="text-xs text-[#64748B] px-1.5 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
            </span>
            {['all', 'Eletrônicos', 'Eletrodomésticos', 'Casa & Cozinha'].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors font-medium ${
                    selectedCategory === cat
                      ? 'bg-[#DBEAFE] text-[#172033] shadow-xs border border-[#BFDBFE]'
                      : 'text-[#64748B] hover:text-[#172033] border border-transparent'
                  }`}
                >
                  {cat === 'all' ? 'Todas' : cat}
                </button>
              )
            )}
          </div>

          {/* Status Select */}
          <div className="w-36">
            <Select
              options={statusOptions}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              sizeVariant="sm"
            />
          </div>
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#64748B] border-collapse min-w-[960px]">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]/80 text-[#94A3B8] uppercase font-semibold text-xs tracking-wider select-none">
              <th className="py-3 px-4">Produto</th>
              <th className="py-3 px-3">Preço</th>
              <th className="py-3 px-3">Desconto</th>
              <th className="py-3 px-3">Avaliação</th>
              <th className="py-3 px-3">Vendas</th>
              <th className="py-3 px-3">Comissão</th>
              <th className="py-3 px-4">Score</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFF6FF]">
            {filteredOffers.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="py-10 text-center text-xs text-[#94A3B8]"
                >
                  Nenhuma oferta encontrada com os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredOffers.map((offer) => {
                const isApproved = offer.status === 'Aprovada';
                const isRejected = offer.status === 'Rejeitada';

                return (
                  <tr
                    key={offer.id}
                    className="hover:bg-[#F1F5F9]/60 transition-colors group"
                  >
                    {/* 1. Produto + Miniatura */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-[#E2E8F0] border border-[#BFDBFE] overflow-hidden shrink-0 flex items-center justify-center p-0.5 relative">
                          <img
                            src={offer.imageUrl}
                            alt={offer.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover rounded-md"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0 max-w-xs md:max-w-sm">
                          <p className="font-semibold text-[#172033] text-xs leading-snug line-clamp-2 group-hover:text-white">
                            {offer.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <MarketplaceBadge marketplace={offer.marketplace} size="sm" />
                            <span className="text-xs text-[#64748B]">•</span>
                            <span className="text-xs text-[#94A3B8]">
                              {offer.category}
                            </span>
                            <span className="text-xs text-[#64748B]">•</span>
                            <span className="text-xs text-[#94A3B8]">
                              {offer.foundAt}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Preço */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="font-mono-numeric font-bold text-[#172033] text-xs">
                        {formatBRL(offer.price)}
                      </div>
                      <div className="text-xs text-[#64748B] line-through font-mono-numeric">
                        {formatBRL(offer.originalPrice)}
                      </div>
                    </td>

                    {/* 3. Desconto */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center font-mono-numeric font-semibold text-xs text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        -{offer.discountPercentage}%
                      </span>
                    </td>

                    {/* 4. Avaliação */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-[#172033] font-mono-numeric font-semibold text-xs">
                        <Star className="w-3.5 h-3.5 text-amber-700 fill-amber-400 shrink-0" />
                        <span>{offer.rating.toFixed(1).replace('.', ',')}</span>
                      </div>
                      <div className="text-xs text-[#64748B]">
                        ({offer.reviewCount.toLocaleString('pt-BR')})
                      </div>
                    </td>

                    {/* 5. Vendas */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="font-mono-numeric font-medium text-xs text-[#172033]">
                        {offer.salesVolume}
                      </span>
                    </td>

                    {/* 6. Comissão */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="font-mono-numeric font-bold text-[#2563EB] text-xs">
                        {formatBRL(offer.commissionAmount)}
                      </div>
                      <div className="text-xs text-[#64748B] font-mono-numeric">
                        ({offer.commissionPercentage}%)
                      </div>
                    </td>

                    {/* 7. Score (Destaque elegante: 92 Excelente) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex items-center justify-center font-mono-numeric font-bold text-xs px-2 py-0.5 rounded border ${
                            offer.score.total >= 90
                              ? 'bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]/40'
                              : 'bg-[#DBEAFE] text-[#2563EB] border-[#BFDBFE]'
                          }`}
                        >
                          {offer.score.total}
                        </div>
                        <span className="text-xs font-medium text-[#334155]">
                          {offer.score.label}
                        </span>
                      </div>
                    </td>

                    {/* 8. Status (Aprovada, Em análise, Rejeitada) */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {isApproved ? (
                        <Badge variant="success" size="sm">
                          Aprovada
                        </Badge>
                      ) : isRejected ? (
                        <Badge variant="danger" size="sm">
                          Rejeitada
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          Em análise
                        </Badge>
                      )}
                    </td>

                    {/* 9. Ações discretas */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Visualizar */}
                        <button
                          type="button"
                          onClick={() => onViewOffer(offer)}
                          className="p-1.5 text-[#64748B] hover:text-[#172033] hover:bg-[#E2E8F0] rounded-md transition-colors"
                          title="Visualizar detalhes da oferta"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Aprovar (se não aprovada) */}
                        {!isApproved && (
                          <button
                            type="button"
                            onClick={() => onApproveOffer(offer.id)}
                            className="p-1.5 text-emerald-700 hover:text-emerald-700 hover:bg-emerald-500/10 rounded-md transition-colors border border-transparent hover:border-emerald-500/20"
                            title="Aprovar oferta"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Rejeitar (se em análise ou aprovada) */}
                        {!isRejected && onRejectOffer && (
                          <button
                            type="button"
                            onClick={() => onRejectOffer(offer.id)}
                            className="p-1.5 text-[#64748B] hover:text-red-700 hover:bg-red-500/10 rounded-md transition-colors border border-transparent hover:border-red-500/20"
                            title="Rejeitar oferta"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Publicar */}
                        <button
                          type="button"
                          onClick={() => onPublishOffer(offer)}
                          className="p-1.5 text-[#2563EB] hover:text-[#3B82F6] hover:bg-[#2563EB]/10 rounded-md transition-colors border border-transparent hover:border-[#2563EB]/25"
                          title="Publicar no canal"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        {/* Link original */}
                        <a
                          href={offer.linkAfiliado}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-[#64748B] hover:text-[#64748B] hover:bg-[#E2E8F0] rounded-md transition-colors"
                          title="Abrir link original"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
