import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  HelpCircle,
  Eye,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Product, Marketplace } from '../../types';
import { MarketplaceBadge } from '../ui/MarketplaceBadge';
import { OfferScoreBadge } from '../offers/OfferScoreBadge';
import { Button } from '../ui/Button';

interface ProductTableProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onPublishProduct?: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onSelectProduct,
  onPublishProduct,
}) => {
  const [hoveredMarketplacesId, setHoveredMarketplacesId] = useState<string | null>(
    null
  );

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const renderPerformanceBadge = (perf: Product['performance']) => {
    switch (perf) {
      case 'Alta':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
            <TrendingUp className="w-3 h-3 stroke-[2.5]" />
            <span>Alta</span>
          </span>
        );
      case 'Média':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/30">
            <Minus className="w-3 h-3 stroke-[2.5]" />
            <span>Média</span>
          </span>
        );
      case 'Baixa':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/10 text-rose-700 border border-rose-500/30">
            <TrendingDown className="w-3 h-3 stroke-[2.5]" />
            <span>Baixa</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]">
            <HelpCircle className="w-3 h-3 text-[#64748B]" />
            <span>Sem dados</span>
          </span>
        );
    }
  };

  const renderMarketplaceBadges = (
    marketplaces: Marketplace[],
    productId: string
  ) => {
    if (marketplaces.length === 0) {
      return <span className="text-xs text-[#64748B]">—</span>;
    }

    const maxVisible = 2;
    const visible = marketplaces.slice(0, maxVisible);
    const hidden = marketplaces.slice(maxVisible);

    return (
      <div className="relative inline-flex items-center gap-1 flex-wrap">
        {visible.map((mp) => (
          <MarketplaceBadge key={mp} marketplace={mp} size="xs" />
        ))}

        {hidden.length > 0 && (
          <div
            className="relative"
            onMouseEnter={() => setHoveredMarketplacesId(productId)}
            onMouseLeave={() => setHoveredMarketplacesId(null)}
          >
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono-numeric font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] cursor-help hover:bg-[#F8FAFC] transition-colors">
              +{hidden.length}
            </span>

            {/* Hover Tooltip showing all marketplaces */}
            {hoveredMarketplacesId === productId && (
              <div className="absolute left-0 bottom-full mb-1.5 z-40 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg shadow-xl p-2 min-w-[140px] space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
                <span className="text-[10px] uppercase font-bold text-[#64748B] block tracking-wider">
                  Todos marketplaces:
                </span>
                <div className="flex flex-wrap gap-1">
                  {marketplaces.map((m) => (
                    <MarketplaceBadge key={m} marketplace={m} size="xs" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4 min-w-[280px]">Produto</th>
              <th className="py-3 px-3 min-w-[170px]">Marketplaces</th>
              <th className="py-3 px-3 min-w-[90px]">Ofertas</th>
              <th className="py-3 px-3 min-w-[130px]">Melhor preço</th>
              <th className="py-3 px-3 min-w-[140px]">Melhor Score</th>
              <th className="py-3 px-3 min-w-[90px]">Vendas</th>
              <th className="py-3 px-3 min-w-[90px]">Publicações</th>
              <th className="py-3 px-3 min-w-[110px]">Performance</th>
              <th className="py-3 px-3 min-w-[100px]">Atualizado</th>
              <th className="py-3 px-4 text-right min-w-[120px]">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFF6FF]">
            {products.map((product) => {
              return (
                <tr
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="hover:bg-[#FFFFFF] transition-colors cursor-pointer group"
                >
                  {/* Coluna 1: Produto */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#FFFFFF] border border-[#DCE3EC] overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#172033] text-xs leading-snug group-hover:text-white line-clamp-1">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[#64748B] text-[11px]">
                          <span className="font-medium text-[#475569]">
                            {product.brand}
                          </span>
                          <span>•</span>
                          <span className="truncate">{product.category}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Coluna 2: Marketplaces */}
                  <td className="py-3 px-3">
                    {renderMarketplaceBadges(product.marketplaces, product.id)}
                  </td>

                  {/* Coluna 3: Ofertas */}
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono-numeric font-semibold ${
                        product.activeOffersCount > 0
                          ? 'bg-[#EFF6FF] text-[#3B82F6] border border-[#BFDBFE]'
                          : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                      }`}
                    >
                      <Layers className="w-3 h-3 text-[#2563EB]" />
                      <span>
                        {product.activeOffersCount}{' '}
                        {product.activeOffersCount === 1 ? 'oferta' : 'ofertas'}
                      </span>
                    </span>
                  </td>

                  {/* Coluna 4: Melhor preço */}
                  <td className="py-3 px-3">
                    {product.activeOffersCount > 0 ? (
                      <div>
                        <span className="font-bold text-[#172033] font-mono-numeric text-xs block leading-tight">
                          {formatCurrency(product.bestPrice.amount)}
                        </span>
                        <span className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                          via{' '}
                          <span className="text-[#2563EB] font-medium">
                            {product.bestPrice.marketplace}
                          </span>
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#64748B]">Sem ofertas</span>
                    )}
                  </td>

                  {/* Coluna 5: Melhor Score */}
                  <td className="py-3 px-3">
                    {product.activeOffersCount > 0 && product.bestScore.score.total > 0 ? (
                      <div>
                        <OfferScoreBadge
                          score={product.bestScore.score}
                          size="sm"
                          showLabel={true}
                        />
                        <span className="text-[11px] text-[#64748B] block mt-0.5">
                          via{' '}
                          <span className="text-[#2563EB] font-medium">
                            {product.bestScore.marketplace}
                          </span>
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#64748B]">—</span>
                    )}
                  </td>

                  {/* Coluna 6: Vendas */}
                  <td className="py-3 px-3">
                    <span className="font-mono-numeric text-xs font-medium text-[#334155]">
                      {product.sales}
                    </span>
                  </td>

                  {/* Coluna 7: Publicações */}
                  <td className="py-3 px-3">
                    <span className="font-mono-numeric text-xs font-medium text-[#334155] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
                      {product.publications}
                    </span>
                  </td>

                  {/* Coluna 8: Performance */}
                  <td className="py-3 px-3">
                    {renderPerformanceBadge(product.performance)}
                  </td>

                  {/* Coluna 9: Atualizado */}
                  <td className="py-3 px-3 text-[#64748B] font-mono-numeric text-[11px] whitespace-nowrap">
                    {product.updatedAt}
                  </td>

                  {/* Coluna 10: Ações */}
                  <td
                    className="py-3 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectProduct(product)}
                        className="h-7 px-2.5 text-xs text-[#2563EB] hover:bg-[#EFF6FF] border border-transparent hover:border-[#BFDBFE]"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        <span>Detalhes</span>
                      </Button>
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
