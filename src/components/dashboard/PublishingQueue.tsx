import React from 'react';
import { Clock, ArrowRight, Radio } from 'lucide-react';
import { initialQueue } from '../../data/mockData';
import { Badge } from '../ui/Badge';

interface PublishingQueueProps {
  onOpenFullQueue: () => void;
}

export const PublishingQueue: React.FC<PublishingQueueProps> = ({
  onOpenFullQueue,
}) => {
  return (
    <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-5 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E2E8F0] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#172033]">
                Próximas publicações
              </h3>
              <p className="text-xs text-[#94A3B8]">Fila automática de canais</p>
            </div>
          </div>

          <span className="text-xs font-mono-numeric text-[#64748B] bg-[#EFF6FF] px-2.5 py-0.5 rounded border border-[#BFDBFE]">
            {initialQueue.length} em fila
          </span>
        </div>

        {/* Queue List */}
        <div className="divide-y divide-[#E2E8F0] my-2">
          {initialQueue.length === 0 && (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-center">
              <Clock className="w-6 h-6 text-[#94A3B8]" />
              <p className="text-xs text-[#64748B]">
                Nenhuma publicação na fila
              </p>
            </div>
          )}
          {initialQueue.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="py-2.5 flex items-center justify-between gap-3 group hover:bg-[#F1F5F9]/60 px-1 rounded-md transition-colors"
            >
              {/* Left: Time & Product info */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Time pill */}
                <span className="text-xs font-mono-numeric font-bold text-[#2563EB] bg-[#F8FAFC] px-2.5 py-1 rounded border border-[#DCE3EC] shrink-0">
                  {item.time}
                </span>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#172033] truncate group-hover:text-[#2563EB] transition-colors">
                    {item.productName}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] mt-0.5">
                    <Radio className="w-3 h-3 text-[#2563EB] shrink-0" />
                    <span className="truncate">{item.channel}</span>
                  </div>
                </div>
              </div>

              {/* Right: Status badge */}
              <div className="shrink-0">
                {item.status === 'Agendado' ? (
                  <Badge variant="info" size="xs">
                    Agendado
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="xs">
                    Em fila
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Link: Ver fila completa */}
      <div className="pt-3 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={onOpenFullQueue}
          className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-[#2563EB] hover:text-[#3B82F6] transition-colors py-1.5 hover:bg-[#EFF6FF] rounded-lg group"
        >
          <span>Ver fila completa</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
