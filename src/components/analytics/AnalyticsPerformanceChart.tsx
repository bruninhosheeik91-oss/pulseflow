import React, { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, MousePointerClick } from 'lucide-react';
import { AnalyticsTimelinePoint } from '../../types';

interface AnalyticsPerformanceChartProps {
  timeline: AnalyticsTimelinePoint[];
}

export const AnalyticsPerformanceChart: React.FC<AnalyticsPerformanceChartProps> = ({
  timeline,
}) => {
  const [metricMode, setMetricMode] = useState<'commission' | 'clicks'>(
    'commission'
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Maximum value for scaling bars
  const maxCommission = Math.max(...timeline.map((t) => t.comissao), 1);
  const maxClicks = Math.max(...timeline.map((t) => t.cliques), 1);

  return (
    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4.5 space-y-4 shadow-sm">
      {/* Chart Header & Mode Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#2563EB]" />
            <h3 className="font-semibold text-[#172033] text-sm">
              Evolução Temporal de Performance
            </h3>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Métricas diárias consolidadas de tráfego e retorno financeiro
          </p>
        </div>

        {/* Toggle Mode */}
        <div className="flex items-center gap-1.5 p-1 bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg">
          <button
            type="button"
            onClick={() => setMetricMode('commission')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              metricMode === 'commission'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Comissões (R$)</span>
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('clicks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              metricMode === 'clicks'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>Cliques & Pedidos</span>
          </button>
        </div>
      </div>

      {/* Visual Chart Container */}
      <div className="relative pt-6 pb-2">
        {/* Empty State */}
        {timeline.length === 0 && (
          <div className="h-56 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] flex flex-col items-center justify-center gap-2 text-center">
            <TrendingUp className="w-7 h-7 text-[#94A3B8]" />
            <p className="text-xs text-[#64748B]">
              Sem dados de performance disponíveis
            </p>
            <p className="text-[11px] text-[#64748B] max-w-xs">
              Os dados aparecerão após as primeiras publicações e sincronizações
              com as APIs de afiliados.
            </p>
          </div>
        )}

        {/* Dynamic Tooltip on Hover */}
        {hoveredIndex !== null && (
          <div className="absolute top-0 right-4 bg-[#F1F5F9] border border-[#93C5FD] px-3 py-1.5 rounded-lg text-xs shadow-xl animate-in fade-in duration-150 z-10 flex items-center gap-3">
            <span className="font-semibold text-[#172033] font-mono">
              {timeline[hoveredIndex].label}:
            </span>
            <span className="text-emerald-700 font-bold font-mono">
              R$ {timeline[hoveredIndex].comissao.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[#64748B]">&bull;</span>
            <span className="text-sky-300 font-mono">
              {timeline[hoveredIndex].cliques.toLocaleString()} cliques
            </span>
            <span className="text-[#64748B]">&bull;</span>
            <span className="text-indigo-700 font-mono">
              {timeline[hoveredIndex].pedidos} pedidos
            </span>
          </div>
        )}

        {timeline.length > 0 && (
        <>
        {/* Bar Grid */}
        <div className="h-56 flex items-end justify-between gap-2.5 sm:gap-4 px-2 border-b border-[#E2E8F0]">
          {timeline.map((point, idx) => {
            const currentVal =
              metricMode === 'commission' ? point.comissao : point.cliques;
            const maxVal =
              metricMode === 'commission' ? maxCommission : maxClicks;
            const heightPercent = Math.max((currentVal / maxVal) * 100, 8);
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={point.date}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Bar Value on top */}
                <div
                  className={`text-[10px] font-mono-numeric mb-1.5 transition-all text-center ${
                    isHovered
                      ? 'text-[#172033] font-bold scale-105'
                      : 'text-[#64748B]'
                  }`}
                >
                  {metricMode === 'commission'
                    ? `R$ ${Math.round(point.comissao)}`
                    : point.cliques}
                </div>

                {/* The Bar */}
                <div className="w-full max-w-[48px] bg-[#FFFFFF] rounded-t-lg overflow-hidden relative flex flex-col justify-end">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      metricMode === 'commission'
                        ? isHovered
                          ? 'bg-gradient-to-t from-[#2563EB] to-emerald-400'
                          : 'bg-gradient-to-t from-[#2563EB] to-[#2563EB]'
                        : isHovered
                        ? 'bg-gradient-to-t from-sky-500 to-indigo-400'
                        : 'bg-gradient-to-t from-[#2563EB]/80 to-sky-400'
                    }`}
                  />
                </div>

                {/* Sub-bar for orders if in clicks mode */}
                {metricMode === 'clicks' && (
                  <div className="text-[10px] text-indigo-700 font-mono mt-1">
                    {point.pedidos} ped.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* X-Axis Labels */}
        <div className="flex justify-between gap-2.5 sm:gap-4 px-2 pt-2.5 text-xs text-[#64748B] font-medium">
          {timeline.map((point) => (
            <div key={point.date} className="flex-1 text-center truncate">
              {point.label.split(' ')[0]}
            </div>
          ))}
        </div>
        </>
        )}
      </div>
    </div>
  );
};
