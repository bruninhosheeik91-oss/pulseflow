import React, { useState } from 'react';
import { Flame, Clock, Sparkles, TrendingUp } from 'lucide-react';
import { HourlyHeatmapPoint } from '../../types';

interface AnalyticsHeatmapProps {
  heatmapData: HourlyHeatmapPoint[];
}

export const AnalyticsHeatmap: React.FC<AnalyticsHeatmapProps> = ({ heatmapData }) => {
  const [selectedHour, setSelectedHour] = useState<HourlyHeatmapPoint | null>(null);

  const getHeatmapColor = (intensity: number) => {
    if (intensity >= 90) return 'bg-[#FF3366] text-white border-[#FF3366] shadow-sm shadow-[#FF3366]/30';
    if (intensity >= 75) return 'bg-[#FF6B00] text-white border-[#FF6B00]';
    if (intensity >= 55) return 'bg-[#FFB800] text-slate-950 border-[#FFB800] font-bold';
    if (intensity >= 30) return 'bg-[#2563EB] text-white border-[#2563EB]';
    if (intensity >= 15) return 'bg-[#EFF6FF] text-[#93C5FD] border-[#93C5FD]';
    return 'bg-[#F8FAFC] text-[#475569] border-[#EFF6FF]';
  };

  return (
    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4.5 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#FF3366]" />
            <h3 className="font-semibold text-[#172033] text-sm">
              Mapa de Calor: Melhores Horários de Conversão
            </h3>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Concentração de cliques e compras por faixa de horário (24 horas)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
          <span>Menor</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#F8FAFC] border border-[#EFF6FF]" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#EFF6FF]" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#2563EB]" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#FFB800]" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#FF3366]" />
          </div>
          <span className="text-[#FF3366] font-bold">Pico Quente</span>
        </div>
      </div>

      {/* Grid of 24 hours */}
      {heatmapData.length === 0 ? (
        <div className="h-40 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] flex flex-col items-center justify-center gap-2 text-center">
          <Flame className="w-7 h-7 text-[#94A3B8]" />
          <p className="text-xs text-[#64748B]">
            Sem dados de horários de conversão
          </p>
          <p className="text-[11px] text-[#64748B] max-w-xs">
            O mapa de calor será preenchido após as primeiras publicações
            registrarem cliques e pedidos.
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
        {heatmapData.map((h) => {
          const colorClass = getHeatmapColor(h.intensity);
          const isSelected = selectedHour?.hour === h.hour;

          return (
            <button
              key={h.hour}
              type="button"
              onClick={() => setSelectedHour(h)}
              className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-between relative ${colorClass} ${
                isSelected ? 'ring-2 ring-white scale-105 z-10' : 'hover:scale-105'
              }`}
            >
              {h.isPeak && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#F8FAFC]" />
              )}
              <span className="text-[11px] font-mono">{h.label}</span>
              <span className="text-xs font-mono font-bold mt-1">
                {h.intensity}%
              </span>
            </button>
          );
        })}
      </div>
      )}

      {/* Selected Hour Details or Insights */}
      {selectedHour ? (
        <div className="p-3 bg-[#F1F5F9] border border-[#93C5FD] rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#2563EB]" />
            <div>
              <span className="font-semibold text-[#172033]">
                Faixa de {selectedHour.label} ({selectedHour.hour}:00 às {selectedHour.hour}:59):
              </span>
              <p className="text-[11px] text-[#93C5FD]">
                {selectedHour.clicks.toLocaleString()} cliques &bull; {selectedHour.orders} pedidos atribuídos &bull; Nível de engajamento: {selectedHour.intensity}%
              </p>
            </div>
          </div>
          {selectedHour.isPeak ? (
            <span className="px-2.5 py-1 bg-[#FF3366]/20 border border-[#FF3366]/40 text-[#FF6688] font-bold rounded-lg text-[11px]">
              🔥 Horário Nobre Recomendado
            </span>
          ) : (
            <span className="text-[11px] text-[#64748B]">
              Janela Regular
            </span>
          )}
        </div>
      ) : heatmapData.length > 0 ? (
        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center gap-2.5 text-xs text-[#64748B]">
          <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span>
            <strong className="text-[#172033]">Insight PULSE FLOW:</strong> Os dois maiores picos de conversão ocorrem entre às <strong className="text-[#2563EB]">11h e 13h</strong> (pausa do almoço) e entre às <strong className="text-emerald-700">19h e 21h30</strong> (horário nobre noturno). Agende suas campanhas prioritárias nessas janelas para maximizar o ROI.
          </span>
        </div>
      ) : (
        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center gap-2.5 text-xs text-[#64748B]">
          <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span>Sem dados suficientes para gerar insights de horários nobres.</span>
        </div>
      )}
    </div>
  );
};
