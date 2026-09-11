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
    <div className="bg-[#0A1020] border border-[#16233B] rounded-xl p-4.5 space-y-4 shadow-sm">
      {/* Chart Header & Mode Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#14203B] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#00C2FF]" />
            <h3 className="font-semibold text-white text-sm">
              Evolução Temporal de Performance
            </h3>
          </div>
          <p className="text-xs text-[#8E9BAE] mt-0.5">
            Métricas diárias consolidadas de tráfego e retorno financeiro
          </p>
        </div>

        {/* Toggle Mode */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0E1628] border border-[#182642] rounded-lg">
          <button
            type="button"
            onClick={() => setMetricMode('commission')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              metricMode === 'commission'
                ? 'bg-[#1E5EFF] text-white shadow-xs'
                : 'text-[#8E9BAE] hover:text-[#E6E8EC]'
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
                ? 'bg-[#1E5EFF] text-white shadow-xs'
                : 'text-[#8E9BAE] hover:text-[#E6E8EC]'
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
          <div className="h-56 rounded-xl bg-[#0B1324] border border-[#162340] flex flex-col items-center justify-center gap-2 text-center">
            <TrendingUp className="w-7 h-7 text-[#5A6470]" />
            <p className="text-xs text-[#8E9BAE]">
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
          <div className="absolute top-0 right-4 bg-[#0E1B33] border border-[#1E3B70] px-3 py-1.5 rounded-lg text-xs shadow-xl animate-in fade-in duration-150 z-10 flex items-center gap-3">
            <span className="font-semibold text-white font-mono">
              {timeline[hoveredIndex].label}:
            </span>
            <span className="text-emerald-400 font-bold font-mono">
              R$ {timeline[hoveredIndex].comissao.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[#8E9BAE]">&bull;</span>
            <span className="text-sky-300 font-mono">
              {timeline[hoveredIndex].cliques.toLocaleString()} cliques
            </span>
            <span className="text-[#8E9BAE]">&bull;</span>
            <span className="text-indigo-300 font-mono">
              {timeline[hoveredIndex].pedidos} pedidos
            </span>
          </div>
        )}

        {timeline.length > 0 && (
        <>
        {/* Bar Grid */}
        <div className="h-56 flex items-end justify-between gap-2.5 sm:gap-4 px-2 border-b border-[#14203B]">
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
                      ? 'text-white font-bold scale-105'
                      : 'text-[#8E9BAE]'
                  }`}
                >
                  {metricMode === 'commission'
                    ? `R$ ${Math.round(point.comissao)}`
                    : point.cliques}
                </div>

                {/* The Bar */}
                <div className="w-full max-w-[48px] bg-[#0E1628] rounded-t-lg overflow-hidden relative flex flex-col justify-end">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      metricMode === 'commission'
                        ? isHovered
                          ? 'bg-gradient-to-t from-[#00C2FF] to-emerald-400'
                          : 'bg-gradient-to-t from-[#1E5EFF] to-[#00C2FF]'
                        : isHovered
                        ? 'bg-gradient-to-t from-sky-500 to-indigo-400'
                        : 'bg-gradient-to-t from-[#1E5EFF]/80 to-sky-400'
                    }`}
                  />
                </div>

                {/* Sub-bar for orders if in clicks mode */}
                {metricMode === 'clicks' && (
                  <div className="text-[10px] text-indigo-300 font-mono mt-1">
                    {point.pedidos} ped.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* X-Axis Labels */}
        <div className="flex justify-between gap-2.5 sm:gap-4 px-2 pt-2.5 text-xs text-[#8E9BAE] font-medium">
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
