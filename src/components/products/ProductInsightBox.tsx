import React from 'react';
import { Sparkles } from 'lucide-react';

interface ProductInsightBoxProps {
  insightText: string;
}

export const ProductInsightBox: React.FC<ProductInsightBoxProps> = ({
  insightText,
}) => {
  return (
    <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#0C1B3B] to-[#0A1428] border border-[#1E3A70] relative overflow-hidden shadow-xs">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#142A58] border border-[#224A94] flex items-center justify-center text-[#00C2FF] shrink-0 mt-0.5 shadow-xs">
          <Sparkles className="w-4 h-4 text-[#00C2FF]" />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#00C2FF] block">
            Insight Operacional
          </span>
          <p className="text-xs text-[#D8E2F0] leading-relaxed font-normal">
            {insightText}
          </p>
        </div>
      </div>
    </div>
  );
};
