import React from 'react';
import { Layers, Eye, TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';
import { Product } from '../../types';
import { MarketplaceBadge } from '../ui/MarketplaceBadge';
import { OfferScoreBadge } from '../offers/OfferScoreBadge';
import { Button } from '../ui/Button';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
}) => {
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
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <TrendingUp className="w-2.5 h-2.5 stroke-[2.5]" />
            <span>Alta</span>
          </span>
        );
      case 'Média':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Minus className="w-2.5 h-2.5 stroke-[2.5]" />
            <span>Média</span>
          </span>
        );
      case 'Baixa':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <TrendingDown className="w-2.5 h-2.5 stroke-[2.5]" />
            <span>Baixa</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#121B30] text-[#8E9BAE] border border-[#1A2846]">
            <HelpCircle className="w-2.5 h-2.5 text-[#64748B]" />
            <span>Sem dados</span>
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onSelectProduct(product)}
      className="bg-[#0B1324] border border-[#162340] hover:border-[#1E5EFF]/50 rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:shadow-[#1E5EFF]/5 group cursor-pointer"
    >
      <div>
        {/* Top: Image, Badges, Performance */}
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-lg bg-[#070C18] border border-[#192747] overflow-hidden shrink-0 flex items-center justify-center p-0.5 relative">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover rounded group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-medium text-[#8E9BAE] truncate">
                {product.brand}
              </span>
              {renderPerformanceBadge(product.performance)}
            </div>

            <h4 className="text-xs font-semibold text-[#E6E8EC] line-clamp-2 leading-snug group-hover:text-white">
              {product.name}
            </h4>

            <span className="text-[11px] text-[#64748B] block mt-0.5">
              {product.category}
            </span>
          </div>
        </div>

        {/* Marketplaces & Quantidade de ofertas */}
        <div className="mt-3 pt-3 border-t border-[#121E38] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            {product.marketplaces.slice(0, 3).map((mp) => (
              <MarketplaceBadge key={mp} marketplace={mp} size="xs" />
            ))}
            {product.marketplaces.length > 3 && (
              <span className="text-[10px] font-mono-numeric font-bold px-1.5 py-0.5 rounded bg-[#13203C] text-[#00C2FF] border border-[#1B325E]">
                +{product.marketplaces.length - 3}
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono-numeric font-semibold bg-[#101F3D] text-[#38BDF8] border border-[#193261]">
            <Layers className="w-3 h-3 text-[#00C2FF]" />
            <span>{product.activeOffersCount}</span>
          </span>
        </div>

        {/* Preço & Deal Score Block */}
        <div className="mt-3 p-2.5 rounded-lg bg-[#070D1B] border border-[#14203B] grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-[#8E9BAE] uppercase font-bold tracking-wider block">
              Melhor Preço
            </span>
            {product.activeOffersCount > 0 ? (
              <div className="mt-0.5">
                <span className="text-xs font-bold font-mono-numeric text-[#E6E8EC]">
                  {formatCurrency(product.bestPrice.amount)}
                </span>
                <span className="text-[10px] text-[#8E9BAE] block truncate">
                  via {product.bestPrice.marketplace}
                </span>
              </div>
            ) : (
              <span className="text-xs text-[#64748B] mt-0.5 block">—</span>
            )}
          </div>

          <div>
            <span className="text-[10px] text-[#8E9BAE] uppercase font-bold tracking-wider block">
              Melhor Score
            </span>
            {product.activeOffersCount > 0 && product.bestScore.score.total > 0 ? (
              <div className="mt-0.5">
                <OfferScoreBadge
                  score={product.bestScore.score}
                  size="sm"
                  showLabel={false}
                />
                <span className="text-[10px] text-[#8E9BAE] block truncate mt-0.5">
                  via {product.bestScore.marketplace}
                </span>
              </div>
            ) : (
              <span className="text-xs text-[#64748B] mt-0.5 block">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-3 pt-2.5 flex items-center justify-between border-t border-[#121E38] text-[11px] text-[#8E9BAE]">
        <span className="font-mono-numeric">
          {product.sales !== '—' ? `${product.sales} vendas` : 'Sem vendas'}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectProduct(product)}
          className="h-7 px-2.5 text-xs text-[#00C2FF] hover:bg-[#121E38] border border-transparent hover:border-[#1E325C]"
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          <span>Ver detalhes</span>
        </Button>
      </div>
    </div>
  );
};
