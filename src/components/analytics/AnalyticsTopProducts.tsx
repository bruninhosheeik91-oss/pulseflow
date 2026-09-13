import React from 'react';
import { Package, Megaphone } from 'lucide-react';
import { TopProductAnalytics, TopCampaignAnalytics } from '../../types';

interface AnalyticsTopProductsProps {
  products: TopProductAnalytics[];
  campaigns: TopCampaignAnalytics[];
}

export const AnalyticsTopProducts: React.FC<AnalyticsTopProductsProps> = ({
  products,
  campaigns,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Top Produtos Mais Lucrativos */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4.5 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#2563EB]" />
            <h3 className="font-semibold text-[#172033] text-sm">
              Top Produtos em Comissão
            </h3>
          </div>
          <span className="text-[11px] text-[#64748B]">Top 5 ofertas</span>
        </div>

        <div className="space-y-2.5">
          {products.length === 0 ? (
            <div className="h-40 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] flex flex-col items-center justify-center gap-2 text-center">
              <Package className="w-7 h-7 text-[#94A3B8]" />
              <p className="text-xs text-[#64748B]">
                Sem produtos com comissão registrada
              </p>
              <p className="text-[11px] text-[#64748B] max-w-xs">
                O ranking aparecerá após as primeiras vendas atribuídas por
                produto.
              </p>
            </div>
          ) : products.map((p, idx) => (
            <div
              key={p.id}
              className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between gap-3 hover:border-[#93C5FD] transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-5 font-mono text-xs font-bold text-[#64748B] text-center">
                  #{idx + 1}
                </span>
                <img
                  src={p.image}
                  alt=""
                  className="w-9 h-9 rounded-lg object-cover bg-[#E2E8F0] shrink-0 border border-[#DCE3EC]"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-[#172033] text-xs truncate max-w-[220px]">
                    {p.name}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-[#64748B] mt-0.5">
                    <span className="text-[#2563EB] font-medium">{p.marketplace}</span>
                    <span>&bull;</span>
                    <span className="font-mono">{p.clicks} cliques</span>
                    <span>&bull;</span>
                    <span className="font-mono text-indigo-700">{p.orders} ped.</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-mono-numeric font-bold text-emerald-700 block">
                  R$ {p.commission.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[10px] text-[#64748B] font-mono">
                  Conv. {p.conversionRate}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Top Campanhas por Performance */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4.5 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-[#172033] text-sm">
              Top Campanhas Automatizadas
            </h3>
          </div>
          <span className="text-[11px] text-[#64748B]">Ordenado por receita</span>
        </div>

        <div className="space-y-2.5">
          {campaigns.length === 0 ? (
            <div className="h-40 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] flex flex-col items-center justify-center gap-2 text-center">
              <Megaphone className="w-7 h-7 text-[#94A3B8]" />
              <p className="text-xs text-[#64748B]">
                Sem campanhas com performance registrada
              </p>
              <p className="text-[11px] text-[#64748B] max-w-xs">
                O ranking aparecerá após campanhas realizarem disparos com
                conversões atribuídas.
              </p>
            </div>
          ) : campaigns.map((c, idx) => (
            <div
              key={c.id}
              className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl hover:border-[#93C5FD] transition-colors space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 font-mono text-xs font-bold text-indigo-400">
                    #{idx + 1}
                  </span>
                  <p className="font-semibold text-[#172033] text-xs truncate max-w-[200px]">
                    {c.name}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono-numeric font-bold text-emerald-700">
                    R$ {c.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-[11px] text-[#64748B] border-t border-[#F1F5F9] pt-2">
                <div>
                  <span>Disparos:</span>
                  <p className="font-mono-numeric font-semibold text-[#172033]">
                    {c.dispatches}
                  </p>
                </div>
                <div>
                  <span>Cliques:</span>
                  <p className="font-mono-numeric font-semibold text-[#172033]">
                    {c.clicks.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span>Pedidos:</span>
                  <p className="font-mono-numeric font-semibold text-indigo-700">
                    {c.orders}
                  </p>
                </div>
                <div>
                  <span>Conversão:</span>
                  <p className="font-mono-numeric font-semibold text-amber-700">
                    {c.conversionRate}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
