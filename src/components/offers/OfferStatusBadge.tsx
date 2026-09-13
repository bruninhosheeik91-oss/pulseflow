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
          bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
        };
      case 'Em análise':
        return {
          icon: Clock,
          bg: 'bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]/35',
        };
      case 'Publicada':
        return {
          icon: Send,
          bg: 'bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]/35',
        };
      case 'Agendada':
        return {
          icon: Clock,
          bg: 'bg-indigo-500/15 text-indigo-700 border-indigo-500/30',
        };
      case 'Rejeitada':
        return {
          icon: XCircle,
          bg: 'bg-rose-500/10 text-rose-700 border-rose-500/30',
        };
      case 'Pausada':
      default:
        return {
          icon: AlertTriangle,
          bg: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
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
