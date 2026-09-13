import React from 'react';
import { ChevronRight, Clock } from 'lucide-react';
import type { MarketplaceProgram } from './marketplaceRegistry';

interface MarketplaceCardProps {
  program: MarketplaceProgram;
  selected: boolean;
  onSelect: (id: string) => void;
  statusBadge?: { label: string; className: string } | null;
}

export const MarketplaceCard: React.FC<MarketplaceCardProps> = ({
  program,
  selected,
  onSelect,
  statusBadge = null,
}) => {
  const Icon = program.icon;

  if (!program.available) {
    return (
      <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col gap-3 opacity-70 select-none">
        <div className="flex items-start justify-between gap-2">
          <div className="w-9 h-9 rounded-lg bg-[#F1F5F9] border border-[#DCE3EC] flex items-center justify-center shrink-0">
            <Icon className={`w-4.5 h-4.5 ${program.iconColorClass}`} />
          </div>
          <span className="text-[10px] font-mono text-[#64748B] bg-[#F1F5F9] border border-[#DCE3EC] px-2 py-0.5 rounded flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Em breve
          </span>
        </div>
        <div>
          <h4 className="font-bold text-white text-xs">{program.name}</h4>
          <p className="text-[10px] text-[#64748B] mt-1 leading-relaxed">
            {program.description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(program.id)}
      className={`p-4 rounded-xl text-left flex flex-col gap-3 cursor-pointer border transition-colors ${
        selected
          ? 'bg-[#F1F5F9] border-[#2563EB]/50 ring-1 ring-[#2563EB]/30'
          : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#94A3B8]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center shrink-0">
          <Icon className={`w-4.5 h-4.5 ${program.iconColorClass}`} />
        </div>
        {statusBadge ? (
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${statusBadge.className}`}
          >
            {statusBadge.label}
          </span>
        ) : (
          <ChevronRight className="w-4 h-4 text-[#64748B]" />
        )}
      </div>
      <div className="min-w-0">
        <h4 className="font-bold text-white text-xs">{program.name}</h4>
        <p className="text-[10px] text-[#64748B] mt-0.5">{program.programName}</p>
      </div>
      <span className="text-[10px] font-medium text-[#2563EB] inline-flex items-center gap-1">
        Configurar
        <ChevronRight className="w-3 h-3" />
      </span>
    </button>
  );
};