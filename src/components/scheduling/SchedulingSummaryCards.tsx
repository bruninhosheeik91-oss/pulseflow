import React from 'react';
import {
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Ban,
} from 'lucide-react';
import {
  ScheduleItem,
  ScheduleStatus,
} from '../../types/scheduling';

interface SchedulingSummaryCardsProps {
  items: ScheduleItem[];
}

interface SummaryCardSpec {
  key: ScheduleStatus;
  label: string;
  icon: React.ReactNode;
  iconClass: string;
  count: number;
  subtext: string;
}

export const SchedulingSummaryCards: React.FC<SchedulingSummaryCardsProps> = ({
  items,
}) => {
  const count = (status: ScheduleStatus) =>
    items.filter((item) => item.status === status).length;

  const cards: SummaryCardSpec[] = [
    {
      key: 'scheduled',
      label: 'Agendados',
      icon: <CalendarClock className="w-4 h-4 text-[#2563EB]" />,
      iconClass: 'bg-[#2563EB]/10',
      count: count('scheduled'),
      subtext: 'Aguardando a data/hora',
    },
    {
      key: 'executed',
      label: 'Executados',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-700" />,
      iconClass: 'bg-emerald-500/10',
      count: count('executed'),
      subtext: 'Disparos concluídos',
    },
    {
      key: 'failed',
      label: 'Falharam',
      icon: <AlertTriangle className="w-4 h-4 text-red-700" />,
      iconClass: 'bg-red-500/10',
      count: count('failed'),
      subtext: count('failed') > 0 ? 'Requerem atenção' : 'Sem falhas registradas',
    },
    {
      key: 'cancelled',
      label: 'Cancelados',
      icon: <Ban className="w-4 h-4 text-[#64748B]" />,
      iconClass: 'bg-[#E2E8F0]',
      count: count('cancelled'),
      subtext: 'Interrompidos manualmente',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card) => (
        <div
          key={card.key}
          className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-4 flex flex-col justify-between hover:border-[#94A3B8] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#94A3B8]">
              {card.label}
            </span>
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.iconClass}`}
            >
              {card.icon}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono-numeric text-[#172033]">
              {card.count}
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">{card.subtext}</p>
        </div>
      ))}
    </div>
  );
};