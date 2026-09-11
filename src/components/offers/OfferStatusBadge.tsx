import React from 'react';
import { DealStatus } from '../../types';
import { CheckCircle2, Clock, Send, AlertTriangle, XCircle } from 'lucide-react';

interface OfferStatusBadgeProps {
  status: DealStatus;
  size?: 'sm' | 'md';
}

export const OfferStatusBadge: React.FC<OfferStatusBadgeProps> = ({
  status,
  size = 'sm',
}) => {
  const getConfig = () => {
    switch (status) {
      case 'Aprovada':
        return {
          icon: CheckCircle2,
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        };
      case 'Em análise':
        return {
          icon: Clock,
          bg: 'bg-[#1E5EFF]/15 text-[#70A1FF] border-[#1E5EFF]/35',
        };
      case 'Publicada':
        return {
          icon: Send,
          bg: 'bg-[#00C2FF]/15 text-[#00C2FF] border-[#00C2FF]/35',
        };
      case 'Agendada':
        return {
          icon: Clock,
          bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        };
      case 'Rejeitada':
        return {
          icon: XCircle,
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        };
      case 'Pausada':
      default:
        return {
          icon: AlertTriangle,
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-medium border whitespace-nowrap transition-colors ${sizeClasses} ${config.bg}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{status}</span>
    </span>
  );
};
