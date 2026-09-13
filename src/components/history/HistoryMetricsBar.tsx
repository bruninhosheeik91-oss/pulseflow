import React from 'react';
import { Send, CheckCircle2, AlertTriangle, MousePointerClick, ShoppingCart, DollarSign } from 'lucide-react';
import { HistoryDispatchItem } from '../../types';

interface HistoryMetricsBarProps {
  historyItems: HistoryDispatchItem[];
}

export const HistoryMetricsBar: React.FC<HistoryMetricsBarProps> = ({ historyItems }) => {
  const totalDispatches = historyItems.length;
  const deliveredCount = historyItems.filter((i) => i.status === 'Entregue' || i.status === 'Re-enviado').length;
  const failedCount = historyItems.filter((i) => i.status === 'Falha').length;
  const deliveryRate = totalDispatches > 0 ? ((deliveredCount / totalDispatches) * 100).toFixed(1) : '100';

  const totalClicks = historyItems.reduce((acc, curr) => acc + curr.clicks, 0);
  const totalOrders = historyItems.reduce((acc, curr) => acc + curr.orders, 0);
  const totalCommission = historyItems.reduce((acc, curr) => acc + curr.commission, 0);
  const avgConversion = totalClicks > 0 ? ((totalOrders / totalClicks) * 100).toFixed(2) : '0.00';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Total Disparos */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#64748B]">
          <span className="text-xs font-medium">Disparos Registrados</span>
          <Send className="w-3.5 h-3.5 text-[#2563EB]" />
        </div>
        <div className="mt-2">
          <span className="text-xl font-bold text-[#172033] font-mono-numeric">
            {totalDispatches}
          </span>
          <p className="text-[11px] text-[#64748B] mt-0.5">no período selecionado</p>
        </div>
      </div>

      {/* 2. Taxa de Entrega */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#64748B]">
          <span className="text-xs font-medium">Taxa de Entrega</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-emerald-700 font-mono-numeric">
              {deliveryRate}%
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            {deliveredCount} sucesso &bull; {failedCount} falhas
          </p>
        </div>
      </div>

      {/* 3. Cliques Gerados */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#64748B]">
          <span className="text-xs font-medium">Cliques Gerados</span>
          <MousePointerClick className="w-3.5 h-3.5 text-[#2563EB]" />
        </div>
        <div className="mt-2">
          <span className="text-xl font-bold text-[#172033] font-mono-numeric">
            {totalClicks.toLocaleString()}
          </span>
          <p className="text-[11px] text-[#64748B] mt-0.5">tráfego qualificado</p>
        </div>
      </div>

      {/* 4. Pedidos Concretizados */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#64748B]">
          <span className="text-xs font-medium">Pedidos Atribuídos</span>
          <ShoppingCart className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div className="mt-2">
          <span className="text-xl font-bold text-[#172033] font-mono-numeric">
            {totalOrders}
          </span>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            Conv. média: <strong className="text-indigo-700">{avgConversion}%</strong>
          </p>
        </div>
      </div>

      {/* 5. Comissões Acumuladas */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-3.5 flex flex-col justify-between col-span-2 md:col-span-1 lg:col-span-2 bg-gradient-to-br from-[#FFFFFF] to-[#E2E8F0]">
        <div className="flex items-center justify-between text-[#64748B]">
          <span className="text-xs font-medium">Comissões Acumuladas</span>
          <DollarSign className="w-4 h-4 text-emerald-700" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-black text-emerald-700 font-mono-numeric">
              R$ {totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] text-[#CBD5E1] mt-0.5">
              Ganho médio p/ disparo: R$ {(totalDispatches > 0 ? totalCommission / totalDispatches : 0).toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
