import React from 'react';
import { Store, TrendingUp, DollarSign, Percent, ArrowUpRight } from 'lucide-react';
import { MarketplacePerformanceItem } from '../../types';

interface AnalyticsMarketplaceShareProps {
  marketplaces: MarketplacePerformanceItem[];
}

export const AnalyticsMarketplaceShare: React.FC<AnalyticsMarketplaceShareProps> = ({
  marketplaces,
}) => {
  const getMarketplaceColor = (marketplace: string) => {
    switch (marketplace) {
      case 'Amazon':
        return { bg: 'bg-[#FF9900]', text: 'text-[#FFB84D]', bar: 'bg-[#FF9900]' };
      case 'Mercado Livre':
        return { bg: 'bg-[#FFE600]', text: 'text-[#FFE600]', bar: 'bg-[#FFE600]' };
      case 'Shopee':
        return { bg: 'bg-[#EE4D2D]', text: 'text-[#FF7A59]', bar: 'bg-[#EE4D2D]' };
      case 'AliExpress':
        return { bg: 'bg-[#FF4747]', text: 'text-[#FF7070]', bar: 'bg-[#FF4747]' };
      case 'Magalu':
        return { bg: 'bg-[#F8FAFC]', text: 'text-[#60A5FA]', bar: 'bg-[#F8FAFC]' };
      default:
        return { bg: 'bg-[#2563EB]', text: 'text-[#2563EB]', bar: 'bg-[#2563EB]' };
    }
  };

  return (
    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4.5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-[#2563EB]" />
            <h3 className="font-semibold text-[#172033] text-sm">
              Performance por Marketplace
            </h3>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Distribuição de faturamento bruto, comissões e eficiência de conversão
          </p>
        </div>
      </div>

      {/* Progress Bars Container */}
      {marketplaces.length === 0 ? (
        <div className="h-40 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] flex flex-col items-center justify-center gap-2 text-center">
          <Store className="w-7 h-7 text-[#94A3B8]" />
          <p className="text-xs text-[#64748B]">
            Sem dados de marketplaces
          </p>
          <p className="text-[11px] text-[#64748B] max-w-xs">
            A distribuição por marketplace aparecerá após as primeiras
            vendas atribuídas.
          </p>
        </div>
      ) : (
      <div className="space-y-3.5">
        {marketplaces.map((item) => {
          const styling = getMarketplaceColor(item.marketplace);

          return (
            <div
              key={item.marketplace}
              className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl hover:border-[#93C5FD] transition-colors"
            >
              {/* Header line */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${styling.bg}`} />
                  <span className="font-bold text-[#172033] text-xs">
                    {item.marketplace}
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    &bull; Top categoria: {item.topCategory}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono-numeric font-bold text-emerald-700">
                    R$ {item.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#172033] bg-[#E2E8F0] px-2 py-0.5 rounded border border-[#BFDBFE]">
                    {item.sharePercentage}%
                  </span>
                </div>
              </div>

              {/* Share bar */}
              <div className="w-full h-2 bg-[#FFFFFF] rounded-full overflow-hidden mb-2.5">
                <div
                  style={{ width: `${item.sharePercentage}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${styling.bar}`}
                />
              </div>

              {/* Sub-metrics */}
              <div className="grid grid-cols-4 gap-2 text-[11px] text-[#64748B] border-t border-[#F1F5F9] pt-2">
                <div>
                  <span>GMV Bruto:</span>
                  <p className="font-mono-numeric font-semibold text-[#172033]">
                    R$ {item.revenue.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <span>Pedidos:</span>
                  <p className="font-mono-numeric font-semibold text-indigo-700">
                    {item.orders}
                  </p>
                </div>
                <div>
                  <span>Cliques:</span>
                  <p className="font-mono-numeric font-semibold text-[#172033]">
                    {item.clicks.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span>Conversão:</span>
                  <p className="font-mono-numeric font-semibold text-amber-700">
                    {item.conversionRate}%
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
