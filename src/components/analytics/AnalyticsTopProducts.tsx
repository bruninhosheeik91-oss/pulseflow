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
      <div className="bg-[#0A1020] border border-[#16233B] rounded-xl p-4.5 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#14203B] pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#00C2FF]" />
            <h3 className="font-semibold text-white text-sm">
              Top Produtos em Comissão
            </h3>
          </div>
          <span className="text-[11px] text-[#8E9BAE]">Top 5 ofertas</span>
        </div>

        <div className="space-y-2.5">
          {products.length === 0 ? (
            <div className="h-40 rounded-xl bg-[#0B1324] border border-[#162340] flex flex-col items-center justify-center gap-2 text-center">
              <Package className="w-7 h-7 text-[#5A6470]" />
              <p className="text-xs text-[#8E9BAE]">
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
              className="p-2.5 bg-[#0B1220] border border-[#16233B] rounded-xl flex items-center justify-between gap-3 hover:border-[#1E3A6D] transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-5 font-mono text-xs font-bold text-[#8E9BAE] text-center">
                  #{idx + 1}
                </span>
                <img
                  src={p.image}
                  alt=""
                  className="w-9 h-9 rounded-lg object-cover bg-[#14203B] shrink-0 border border-[#192747]"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-white text-xs truncate max-w-[220px]">
                    {p.name}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-[#8E9BAE] mt-0.5">
                    <span className="text-[#00C2FF] font-medium">{p.marketplace}</span>
                    <span>&bull;</span>
                    <span className="font-mono">{p.clicks} cliques</span>
                    <span>&bull;</span>
                    <span className="font-mono text-indigo-300">{p.orders} ped.</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-mono-numeric font-bold text-emerald-400 block">
                  R$ {p.commission.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[10px] text-[#8E9BAE] font-mono">
                  Conv. {p.conversionRate}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Top Campanhas por Performance */}
      <div className="bg-[#0A1020] border border-[#16233B] rounded-xl p-4.5 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#14203B] pb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-white text-sm">
              Top Campanhas Automatizadas
            </h3>
          </div>
          <span className="text-[11px] text-[#8E9BAE]">Ordenado por receita</span>
        </div>

        <div className="space-y-2.5">
          {campaigns.length === 0 ? (
            <div className="h-40 rounded-xl bg-[#0B1324] border border-[#162340] flex flex-col items-center justify-center gap-2 text-center">
              <Megaphone className="w-7 h-7 text-[#5A6470]" />
              <p className="text-xs text-[#8E9BAE]">
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
              className="p-3 bg-[#0B1220] border border-[#16233B] rounded-xl hover:border-[#1E3A6D] transition-colors space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 font-mono text-xs font-bold text-indigo-400">
                    #{idx + 1}
                  </span>
                  <p className="font-semibold text-white text-xs truncate max-w-[200px]">
                    {c.name}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono-numeric font-bold text-emerald-400">
                    R$ {c.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-[11px] text-[#8E9BAE] border-t border-[#131D33] pt-2">
                <div>
                  <span>Disparos:</span>
                  <p className="font-mono-numeric font-semibold text-white">
                    {c.dispatches}
                  </p>
                </div>
                <div>
                  <span>Cliques:</span>
                  <p className="font-mono-numeric font-semibold text-white">
                    {c.clicks.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span>Pedidos:</span>
                  <p className="font-mono-numeric font-semibold text-indigo-300">
                    {c.orders}
                  </p>
                </div>
                <div>
                  <span>Conversão:</span>
                  <p className="font-mono-numeric font-semibold text-amber-400">
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
