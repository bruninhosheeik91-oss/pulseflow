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
    if (intensity >= 30) return 'bg-[#1E5EFF] text-white border-[#1E5EFF]';
    if (intensity >= 15) return 'bg-[#102347] text-[#93C5FD] border-[#1E3B70]';
    return 'bg-[#0B1426] text-[#475569] border-[#121E36]';
  };

  return (
    <div className="bg-[#0A1020] border border-[#16233B] rounded-xl p-4.5 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#14203B] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#FF3366]" />
            <h3 className="font-semibold text-white text-sm">
              Mapa de Calor: Melhores Horários de Conversão
            </h3>
          </div>
          <p className="text-xs text-[#8E9BAE] mt-0.5">
            Concentração de cliques e compras por faixa de horário (24 horas)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[11px] text-[#8E9BAE]">
          <span>Menor</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#0B1426] border border-[#121E36]" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#102347]" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#1E5EFF]" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#FFB800]" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#FF3366]" />
          </div>
          <span className="text-[#FF3366] font-bold">Pico Quente</span>
        </div>
      </div>

      {/* Grid of 24 hours */}
      {heatmapData.length === 0 ? (
        <div className="h-40 rounded-xl bg-[#0B1324] border border-[#162340] flex flex-col items-center justify-center gap-2 text-center">
          <Flame className="w-7 h-7 text-[#5A6470]" />
          <p className="text-xs text-[#8E9BAE]">
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
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0A1020]" />
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
        <div className="p-3 bg-[#0E1B33] border border-[#1E3B70] rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00C2FF]" />
            <div>
              <span className="font-semibold text-white">
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
            <span className="text-[11px] text-[#8E9BAE]">
              Janela Regular
            </span>
          )}
        </div>
      ) : heatmapData.length > 0 ? (
        <div className="p-3 bg-[#0B1220] border border-[#16233B] rounded-xl flex items-center gap-2.5 text-xs text-[#8E9BAE]">
          <Sparkles className="w-4 h-4 text-[#00C2FF] shrink-0" />
          <span>
            <strong className="text-white">Insight DOMNEX:</strong> Os dois maiores picos de conversão ocorrem entre às <strong className="text-[#00C2FF]">11h e 13h</strong> (pausa do almoço) e entre às <strong className="text-emerald-400">19h e 21h30</strong> (horário nobre noturno). Agende suas campanhas prioritárias nessas janelas para maximizar o ROI.
          </span>
        </div>
      ) : (
        <div className="p-3 bg-[#0B1220] border border-[#16233B] rounded-xl flex items-center gap-2.5 text-xs text-[#8E9BAE]">
          <Sparkles className="w-4 h-4 text-[#00C2FF] shrink-0" />
          <span>Sem dados suficientes para gerar insights de horários nobres.</span>
        </div>
      )}
    </div>
  );
};
