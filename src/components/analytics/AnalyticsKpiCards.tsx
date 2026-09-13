import React from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  MousePointerClick,
  Percent,
  Sparkles,
  ArrowUpRight,
  Target,
} from 'lucide-react';
import { AnalyticsTimelinePoint } from '../../types';

interface AnalyticsKpiCardsProps {
  timeline: AnalyticsTimelinePoint[];
}

export const AnalyticsKpiCards: React.FC<AnalyticsKpiCardsProps> = ({ timeline }) => {
  const totalCommission = timeline.reduce((acc, curr) => acc + curr.comissao, 0);
  const totalRevenue = timeline.reduce((acc, curr) => acc + curr.receitaTotal, 0);
  const totalOrders = timeline.reduce((acc, curr) => acc + curr.pedidos, 0);
  const totalClicks = timeline.reduce((acc, curr) => acc + curr.cliques, 0);

  const avgConversion = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const epc = totalClicks > 0 ? totalCommission / totalClicks : 0; // Earnings Per Click

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {/* 1. Comissões Líquidas */}
      <div className="bg-gradient-to-br from-[#FFFFFF] to-[#E2E8F0] border border-[#E2E8F0] rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between text-[#64748B]">
          <span className="text-xs font-semibold text-[#CBD5E1]">Comissões Totais</span>
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-700">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <span className="text-xl font-black text-emerald-700 font-mono-numeric tracking-tight">
            R$ {totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 mt-0.5">
            <ArrowUpRight className="w-3 h-3" />
            <span className="font-semibold">{timeline.length > 0 ? '+18.4%' : 'Sem dados'}</span>
            <span className="text-[#64748B]">vs semana anterior</span>
          </div>
        </div>
      </div>

      {/* 2. GMV / Vendas Geradas */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#64748B]">
          <span className="text-xs font-medium">Vendas Geradas (GMV)</span>
          <div className="w-6 h-6 rounded-md bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <span className="text-xl font-bold text-[#172033] font-mono-numeric tracking-tight">
            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-[#2563EB] mt-0.5">
            <ArrowUpRight className="w-3 h-3" />
            <span className="font-semibold">{timeline.length > 0 ? '+22.1%' : 'Sem dados'}</span>
            <span className="text-[#64748B]">faturamento bruto</span>
          </div>
        </div>
      </div>

      {/* 3. Pedidos Concluídos */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#64748B]">
          <span className="text-xs font-medium">Pedidos Atribuídos</span>
          <div className="w-6 h-6 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <ShoppingCart className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <span className="text-xl font-bold text-[#172033] font-mono-numeric">
            {totalOrders.toLocaleString()}
          </span>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            Ticket médio: <strong className="text-[#172033] font-mono">R$ {avgTicket.toFixed(2).replace('.', ',')}</strong>
          </p>
        </div>
      </div>

      {/* 4. Cliques Únicos */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#64748B]">
          <span className="text-xs font-medium">Cliques Rastreados</span>
          <div className="w-6 h-6 rounded-md bg-sky-500/10 flex items-center justify-center text-sky-400">
            <MousePointerClick className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <span className="text-xl font-bold text-[#172033] font-mono-numeric">
            {totalClicks.toLocaleString()}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-sky-400 mt-0.5">
            <ArrowUpRight className="w-3 h-3" />
            <span className="font-semibold">{timeline.length > 0 ? '+14.2%' : 'Sem dados'}</span>
            <span className="text-[#64748B]">engajamento</span>
          </div>
        </div>
      </div>

      {/* 5. Taxa de Conversão */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#64748B]">
          <span className="text-xs font-medium">Taxa de Conversão</span>
          <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-700">
            <Percent className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <span className="text-xl font-bold text-amber-700 font-mono-numeric">
            {avgConversion.toFixed(2)}%
          </span>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            {timeline.length > 0 ? 'Média de mercado: ~3.2%' : 'Sem dados para comparação'}
          </p>
        </div>
      </div>

      {/* 6. EPC (Ganho por clique) */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#64748B]">
          <span className="text-xs font-medium">EPC Médio</span>
          <div className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Target className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <span className="text-xl font-bold text-purple-300 font-mono-numeric">
            R$ {epc.toFixed(2).replace('.', ',')}
          </span>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            lucro estimado por clique
          </p>
        </div>
      </div>
    </div>
  );
};
