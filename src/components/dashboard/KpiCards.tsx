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
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-4 hover:border-[#93C5FD] transition-colors flex flex-col justify-between min-h-[100px] group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
            Ofertas Encontradas
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#E2E8F0] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
            <Radar className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-1.5">
          <div className="text-xl lg:text-2xl font-bold font-mono-numeric text-[#172033] tracking-tight">
            —
          </div>
          <span className="text-[10px] text-[#64748B]">Sem dados</span>
        </div>
      </div>

      {/* 2. Ofertas Aprovadas */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-4 hover:border-[#93C5FD] transition-colors flex flex-col justify-between min-h-[100px] group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
            Ofertas Aprovadas
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#E2E8F0] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-1.5">
          <div className="text-xl lg:text-2xl font-bold font-mono-numeric text-[#172033] tracking-tight">
            —
          </div>
          <span className="text-[10px] text-[#64748B]">Sem dados</span>
        </div>
      </div>

      {/* 3. Publicações Hoje */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-4 hover:border-[#93C5FD] transition-colors flex flex-col justify-between min-h-[100px] group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
            Publicações Hoje
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#E2E8F0] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
            <Send className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-1.5">
          <div className="text-xl lg:text-2xl font-bold font-mono-numeric text-[#172033] tracking-tight">
            —
          </div>
          <span className="text-[10px] text-[#64748B]">Sem dados</span>
        </div>
      </div>

      {/* 4. Comissão Estimada */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-4 hover:border-[#93C5FD] transition-colors flex flex-col justify-between min-h-[100px] group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
            Comissão Estimada
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#E2E8F0] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-1.5">
          <div className="text-xl lg:text-2xl font-bold font-mono-numeric text-[#172033] tracking-tight">
            —
          </div>
          <span className="text-[10px] text-[#64748B]">Sem dados</span>
        </div>
      </div>
    </section>
  );
};