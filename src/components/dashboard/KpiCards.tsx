import React from 'react';
import {
  Radar,
  CheckCircle2,
  Send,
  TrendingUp,
} from 'lucide-react';

export const KpiCards: React.FC = () => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* 1. Ofertas Encontradas */}
      <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-4 hover:border-[#243760] transition-colors flex flex-col justify-between min-h-[100px] group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-[#8E9BAE] uppercase tracking-wider">
            Ofertas Encontradas
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#14203B] border border-[#1E3057] flex items-center justify-center text-[#00C2FF] shrink-0">
            <Radar className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-1.5">
          <div className="text-xl lg:text-2xl font-bold font-mono-numeric text-[#E6E8EC] tracking-tight">
            —
          </div>
          <span className="text-[10px] text-[#8E9BAE]">Sem dados</span>
        </div>
      </div>

      {/* 2. Ofertas Aprovadas */}
      <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-4 hover:border-[#243760] transition-colors flex flex-col justify-between min-h-[100px] group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-[#8E9BAE] uppercase tracking-wider">
            Ofertas Aprovadas
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#14203B] border border-[#1E3057] flex items-center justify-center text-[#1E5EFF] shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-1.5">
          <div className="text-xl lg:text-2xl font-bold font-mono-numeric text-[#E6E8EC] tracking-tight">
            —
          </div>
          <span className="text-[10px] text-[#8E9BAE]">Sem dados</span>
        </div>
      </div>

      {/* 3. Publicações Hoje */}
      <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-4 hover:border-[#243760] transition-colors flex flex-col justify-between min-h-[100px] group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-[#8E9BAE] uppercase tracking-wider">
            Publicações Hoje
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#14203B] border border-[#1E3057] flex items-center justify-center text-[#00C2FF] shrink-0">
            <Send className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-1.5">
          <div className="text-xl lg:text-2xl font-bold font-mono-numeric text-[#E6E8EC] tracking-tight">
            —
          </div>
          <span className="text-[10px] text-[#8E9BAE]">Sem dados</span>
        </div>
      </div>

      {/* 4. Comissão Estimada */}
      <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-4 hover:border-[#243760] transition-colors flex flex-col justify-between min-h-[100px] group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-[#8E9BAE] uppercase tracking-wider">
            Comissão Estimada
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#14203B] border border-[#1E3057] flex items-center justify-center text-[#1E5EFF] shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-1.5">
          <div className="text-xl lg:text-2xl font-bold font-mono-numeric text-[#E6E8EC] tracking-tight">
            —
          </div>
          <span className="text-[10px] text-[#8E9BAE]">Sem dados</span>
        </div>
      </div>
    </section>
  );
};