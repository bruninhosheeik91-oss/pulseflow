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
        return { bg: 'bg-[#0086FF]', text: 'text-[#60A5FA]', bar: 'bg-[#0086FF]' };
      default:
        return { bg: 'bg-[#1E5EFF]', text: 'text-[#70A1FF]', bar: 'bg-[#1E5EFF]' };
    }
  };

  return (
    <div className="bg-[#0A1020] border border-[#16233B] rounded-xl p-4.5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#14203B] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-[#00C2FF]" />
            <h3 className="font-semibold text-white text-sm">
              Performance por Marketplace
            </h3>
          </div>
          <p className="text-xs text-[#8E9BAE] mt-0.5">
            Distribuição de faturamento bruto, comissões e eficiência de conversão
          </p>
        </div>
      </div>

      {/* Progress Bars Container */}
      {marketplaces.length === 0 ? (
        <div className="h-40 rounded-xl bg-[#0B1324] border border-[#162340] flex flex-col items-center justify-center gap-2 text-center">
          <Store className="w-7 h-7 text-[#5A6470]" />
          <p className="text-xs text-[#8E9BAE]">
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
              className="p-3 bg-[#0B1220] border border-[#16233B] rounded-xl hover:border-[#1E3A6D] transition-colors"
            >
              {/* Header line */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${styling.bg}`} />
                  <span className="font-bold text-white text-xs">
                    {item.marketplace}
                  </span>
                  <span className="text-[11px] text-[#8E9BAE]">
                    &bull; Top categoria: {item.topCategory}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono-numeric font-bold text-emerald-400">
                    R$ {item.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-mono font-bold text-white bg-[#14203B] px-2 py-0.5 rounded border border-[#1E325C]">
                    {item.sharePercentage}%
                  </span>
                </div>
              </div>

              {/* Share bar */}
              <div className="w-full h-2 bg-[#0E1628] rounded-full overflow-hidden mb-2.5">
                <div
                  style={{ width: `${item.sharePercentage}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${styling.bar}`}
                />
              </div>

              {/* Sub-metrics */}
              <div className="grid grid-cols-4 gap-2 text-[11px] text-[#8E9BAE] border-t border-[#131D33] pt-2">
                <div>
                  <span>GMV Bruto:</span>
                  <p className="font-mono-numeric font-semibold text-white">
                    R$ {item.revenue.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <span>Pedidos:</span>
                  <p className="font-mono-numeric font-semibold text-indigo-300">
                    {item.orders}
                  </p>
                </div>
                <div>
                  <span>Cliques:</span>
                  <p className="font-mono-numeric font-semibold text-white">
                    {item.clicks.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span>Conversão:</span>
                  <p className="font-mono-numeric font-semibold text-amber-400">
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
