import React from 'react';
import {
  AlertTriangle,
  CalendarClock,
  MessageSquare,
  RefreshCw,
  Trash2,
  Ban,
} from 'lucide-react';
import {
  ScheduleItem,
  formatScheduleDate,
} from '../../types/scheduling';
import { ScheduleStatusBadge } from './ScheduleStatusBadge';
import { Button } from '../ui/Button';

interface SchedulingTableProps {
  items: ScheduleItem[];
  /** Nome real atual da conta por sessionId (fallback: snapshot da linha). */
  accountLabels: Record<string, string>;
  /** Nome real atual do grupo por id (fallback: snapshot da linha). */
  groupLabels: Record<string, string>;
  /** Id do agendamento com uma operação em andamento (botões desabilitados). */
  pendingId?: string | null;
  onCancel: (item: ScheduleItem) => void;
  onRetry: (item: ScheduleItem) => void;
  onRemove: (item: ScheduleItem) => void;
}

export const SchedulingTable: React.FC<SchedulingTableProps> = ({
  items,
  accountLabels,
  groupLabels,
  pendingId = null,
  onCancel,
  onRetry,
  onRemove,
}) => {
  if (items.length === 0) {
    return (
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl py-14 text-center">
        <CalendarClock className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
        <p className="text-xs text-[#94A3B8]">
          Nenhum agendamento encontrado para os filtros ativos.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#94A3B8] font-semibold">
              <th className="py-3 px-4">Título</th>
              <th className="py-3 px-4">Conta WhatsApp</th>
              <th className="py-3 px-4">Destino / Grupo</th>
              <th className="py-3 px-4">Data e hora</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {items.map((item) => {
              const accountName =
                (item.accountSessionId &&
                  accountLabels[item.accountSessionId]) ||
                item.accountName;
              const groupName =
                (item.groupId && groupLabels[item.groupId]) ||
                item.groupName;
              const busy = pendingId === item.id;

              return (
                <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#172033] truncate max-w-[220px]">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-[#94A3B8] truncate max-w-[220px]">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#334155] whitespace-nowrap">
                    {accountName || '—'}
                  </td>
                  <td className="py-3 px-4 text-[#334155] whitespace-nowrap">
                    {groupName || '—'}
                  </td>
                  <td className="py-3 px-4 text-[#334155] whitespace-nowrap">
                    <span className="font-medium">
                      {formatScheduleDate(item.date)}
                    </span>
                    <span className="text-[#94A3B8]"> · </span>
                    <span className="text-[#334155]">{item.time}</span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <ScheduleStatusBadge status={item.status} />
                    {item.status === 'failed' && item.errorMessage && (
                      <p
                        className="mt-1 text-[10px] text-red-700 max-w-[220px] truncate"
                        title={item.errorMessage}
                      >
                        {item.errorMessage}
                      </p>
                    )}
                    {item.status === 'failed' && item.deliveryUncertain && (
                      <p className="mt-1 text-[10px] text-amber-700 max-w-[260px] flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                        <span>
                          Envio não confirmado — pode ter sido entregue.
                          Verifique o grupo antes de reenviar.
                        </span>
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {(item.status === 'scheduled' ||
                        item.status === 'running') && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => onCancel(item)}
                          disabled={busy}
                          loading={busy}
                        >
                          <Ban className="w-3 h-3" />
                          Cancelar
                        </Button>
                      )}
                      {item.status === 'failed' && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => onRetry(item)}
                          disabled={busy}
                          loading={busy}
                        >
                          <RefreshCw className="w-3 h-3" />
                          Reenviar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remover ${item.title}`}
                        onClick={() => onRemove(item)}
                        disabled={busy}
                        loading={busy}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};