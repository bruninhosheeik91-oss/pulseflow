import React from 'react';
import { Sparkles } from 'lucide-react';

interface ProductInsightBoxProps {
  insightText: string;
}

export const ProductInsightBox: React.FC<ProductInsightBoxProps> = ({
  insightText,
}) => {
  return (
    <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#EFF6FF] to-[#EFF6FF] border border-[#E2E8F0] relative overflow-hidden shadow-xs">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#2563EB] shrink-0 mt-0.5 shadow-xs">
          <Sparkles className="w-4 h-4 text-[#2563EB]" />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] block">
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
