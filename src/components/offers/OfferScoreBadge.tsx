import React from 'react';
import { DealScoreDetails } from '../../types';

interface OfferScoreBadgeProps {
  score: DealScoreDetails;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const OfferScoreBadge: React.FC<OfferScoreBadgeProps> = ({
  score,
  size = 'sm',
  showLabel = true,
}) => {
  const { total, label } = score;

  // Visual categorization based on score tier
  const getScoreTheme = (val: number) => {
    if (val >= 90) {
      return {
        bg: 'bg-[#102347]',
        border: 'border-[#1E5EFF]/50',
        text: 'text-[#00C2FF]',
        labelColor: 'text-[#00C2FF]',
        dot: 'bg-[#00C2FF]',
      };
    }
    if (val >= 80) {
      return {
        bg: 'bg-[#0E203C]',
        border: 'border-[#1B3E7A]/50',
        text: 'text-[#38BDF8]',
        labelColor: 'text-[#70A1FF]',
        dot: 'bg-[#38BDF8]',
      };
    }
    if (val >= 70) {
      return {
        bg: 'bg-[#2A2312]',
        border: 'border-amber-500/40',
        text: 'text-amber-400',
        labelColor: 'text-amber-300',
        dot: 'bg-amber-400',
      };
    }
    return {
      bg: 'bg-[#21161A]',
      border: 'border-rose-500/40',
      text: 'text-rose-400',
      labelColor: 'text-rose-300',
      dot: 'bg-rose-400',
    };
  };

  const theme = getScoreTheme(total);

  if (size === 'sm') {
    return (
      <div className="inline-flex items-center gap-1.5">
        <div
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono-numeric font-bold text-xs ${theme.bg} ${theme.border} ${theme.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${theme.dot} shrink-0`} />
          <span>{total}</span>
        </div>
        {showLabel && (
          <span className={`text-xs font-medium ${theme.labelColor} hidden sm:inline whitespace-nowrap`}>
            {label}
          </span>
        )}
      </div>
    );
  }

  if (size === 'md') {
    return (
      <div className="flex items-center gap-2">
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono-numeric font-bold text-sm ${theme.bg} ${theme.border} ${theme.text}`}
        >
          <span className={`w-2 h-2 rounded-full ${theme.dot} shrink-0`} />
          <span>{total}</span>
        </div>
        {showLabel && (
          <div className="flex flex-col leading-tight">
            <span className={`text-xs font-semibold ${theme.labelColor}`}>
              {label}
            </span>
            <span className="text-[11px] text-[#8E9BAE]">Deal Score</span>
          </div>
        )}
      </div>
    );
  }

  // size === 'lg' (used in OfferDetailDrawer)
  return (
    <div
      className={`p-3.5 rounded-xl border flex items-center justify-between ${theme.bg} ${theme.border}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-[#0A1020] border border-[#1E3360] flex items-center justify-center font-mono-numeric font-bold text-xl text-white">
          <span className={theme.text}>{total}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${theme.labelColor}`}>
              {total >= 90 ? 'Excelente oportunidade' : `${label} oportunidade`}
            </span>
          </div>
          <p className="text-xs text-[#8E9BAE] mt-0.5">
            Classificado automaticamente pelos critérios do motor
          </p>
        </div>
      </div>
      <span className="text-xs font-mono-numeric font-semibold text-[#8E9BAE] bg-[#0A1020] px-2.5 py-1 rounded-md border border-[#1B2B4E]">
        {total} / 100
      </span>
    </div>
  );
};
