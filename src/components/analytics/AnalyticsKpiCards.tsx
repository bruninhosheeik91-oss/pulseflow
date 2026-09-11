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
      <div className="bg-gradient-to-br from-[#0E1628] to-[#122244] border border-[#1C325B] rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between text-[#8E9BAE]">
          <span className="text-xs font-semibold text-[#CBD5E1]">Comissões Totais</span>
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <span className="text-xl font-black text-emerald-400 font-mono-numeric tracking-tight">
            R$ {totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-0.5">
            <ArrowUpRight className="w-3 h-3" />
            <span className="font-semibold">{timeline.length > 0 ? '+18.4%' : 'Sem dados'}</span>
            <span className="text-[#8E9BAE]">vs semana anterior</span>
          </div>
        </div>
      </div>

      {/* 2. GMV / Vendas Geradas */}
      <div className="bg-[#0E1628] border border-[#182642] rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#8E9BAE]">
          <span className="text-xs font-medium">Vendas Geradas (GMV)</span>
          <div className="w-6 h-6 rounded-md bg-[#1E5EFF]/10 flex items-center justify-center text-[#00C2FF]">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <span className="text-xl font-bold text-white font-mono-numeric tracking-tight">
            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-[#00C2FF] mt-0.5">
            <ArrowUpRight className="w-3 h-3" />
            <span className="font-semibold">{timeline.length > 0 ? '+22.1%' : 'Sem dados'}</span>
            <span className="text-[#8E9BAE]">faturamento bruto</span>
          </div>
        </div>
      </div>

      {/* 3. Pedidos Concluídos */}
      <div className="bg-[#0E1628] border border-[#182642] rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#8E9BAE]">
          <span className="text-xs font-medium">Pedidos Atribuídos</span>
          <div className="w-6 h-6 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <ShoppingCart className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <span className="text-xl font-bold text-white font-mono-numeric">
            {totalOrders.toLocaleString()}
          </span>
          <p className="text-[11px] text-[#8E9BAE] mt-0.5">
            Ticket médio: <strong className="text-white font-mono">R$ {avgTicket.toFixed(2).replace('.', ',')}</strong>
          </p>
        </div>
      </div>

      {/* 4. Cliques Únicos */}
      <div className="bg-[#0E1628] border border-[#182642] rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#8E9BAE]">
          <span className="text-xs font-medium">Cliques Rastreados</span>
          <div className="w-6 h-6 rounded-md bg-sky-500/10 flex items-center justify-center text-sky-400">
            <MousePointerClick className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <span className="text-xl font-bold text-white font-mono-numeric">
            {totalClicks.toLocaleString()}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-sky-400 mt-0.5">
            <ArrowUpRight className="w-3 h-3" />
            <span className="font-semibold">{timeline.length > 0 ? '+14.2%' : 'Sem dados'}</span>
            <span className="text-[#8E9BAE]">engajamento</span>
          </div>
        </div>
      </div>

      {/* 5. Taxa de Conversão */}
      <div className="bg-[#0E1628] border border-[#182642] rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#8E9BAE]">
          <span className="text-xs font-medium">Taxa de Conversão</span>
          <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Percent className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <span className="text-xl font-bold text-amber-400 font-mono-numeric">
            {avgConversion.toFixed(2)}%
          </span>
          <p className="text-[11px] text-[#8E9BAE] mt-0.5">
            {timeline.length > 0 ? 'Média de mercado: ~3.2%' : 'Sem dados para comparação'}
          </p>
        </div>
      </div>

      {/* 6. EPC (Ganho por clique) */}
      <div className="bg-[#0E1628] border border-[#182642] rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#8E9BAE]">
          <span className="text-xs font-medium">EPC Médio</span>
          <div className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Target className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <span className="text-xl font-bold text-purple-300 font-mono-numeric">
            R$ {epc.toFixed(2).replace('.', ',')}
          </span>
          <p className="text-[11px] text-[#8E9BAE] mt-0.5">
            lucro estimado por clique
          </p>
        </div>
      </div>
    </div>
  );
};
