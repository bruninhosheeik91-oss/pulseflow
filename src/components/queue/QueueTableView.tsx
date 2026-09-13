import React, { useState } from 'react';
import {
  Clock,
  Send,
  Eye,
  Trash2,
  Radio,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Zap,
  ArrowUpDown,
  Ticket,
} from 'lucide-react';
import { QueueItem } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AutomationOriginBadge } from '../ui/AutomationOriginBadge';

interface QueueTableViewProps {
  items: QueueItem[];
  onDispatchNow: (item: QueueItem) => void;
  onPreviewMessage: (item: QueueItem) => void;
  onReschedule: (item: QueueItem) => void;
  onRemoveItem: (item: QueueItem) => void;
  onBulkDispatch?: (items: QueueItem[]) => void;
  onBulkRemove?: (items: QueueItem[]) => void;
}

export const QueueTableView: React.FC<QueueTableViewProps> = ({
  items,
  onDispatchNow,
  onPreviewMessage,
  onReschedule,
  onRemoveItem,
  onBulkDispatch,
  onBulkRemove,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectedItems = items.filter((i) => selectedIds.includes(i.id));

  if (items.length === 0) {
    return (
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl py-14 text-center">
        <Clock className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
        <p className="text-xs text-[#94A3B8]">
          Nenhuma publicação encontrada para os filtros ativos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Bulk Operations Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#EFF6FF] border border-[#93C5FD] rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-[#172033]">
            <span className="font-semibold text-[#2563EB]">
              {selectedIds.length}
            </span>
            <span>publicações selecionadas</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onBulkDispatch?.(selectedItems);
                setSelectedIds([]);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:bg-[#1E40AF] font-medium transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Disparar Selecionados</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onBulkRemove?.(selectedItems);
                setSelectedIds([]);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 border border-rose-500/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remover Selecionados</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#94A3B8] font-semibold">
                <th className="py-3 px-4 w-8">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === items.length && items.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-[#DCE3EC] bg-[#E2E8F0] text-[#2563EB] focus:ring-0 focus:ring-offset-0"
                  />
                </th>
                <th className="py-3 px-3">Horário / Previsão</th>
                <th className="py-3 px-3">Produto & Oferta</th>
                <th className="py-3 px-3">Marketplace & Preço</th>
                <th className="py-3 px-3">Canal Destino</th>
                <th className="py-3 px-3">Origem</th>
                <th className="py-3 px-3">Campanha</th>
                <th className="py-3 px-3 text-center">Score</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isWhatsApp =
                  item.channelPlatform === 'WhatsApp' ||
                  item.channel.toLowerCase().includes('whatsapp');

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-[#F1F5F9]/60 transition-colors ${
                      isSelected ? 'bg-[#E2E8F0]/50' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(item.id)}
                        className="rounded border-[#DCE3EC] bg-[#E2E8F0] text-[#2563EB] focus:ring-0 focus:ring-offset-0"
                      />
                    </td>

                    {/* Horário / Status timing */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-numeric font-bold text-[#2563EB] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#DCE3EC]">
                          {item.time}
                        </span>
                        {item.estimatedInMinutes !== undefined &&
                          (item.status === 'Em fila' ||
                            item.status === 'Agendado') && (
                            <span className="text-[10px] text-[#64748B]">
                              ~{item.estimatedInMinutes}m
                            </span>
                          )}
                      </div>
                    </td>

                    {/* Produto */}
                    <td className="py-3 px-3 max-w-[280px]">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.productImage}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover bg-[#E2E8F0] border border-[#BFDBFE] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-[#172033] truncate hover:text-[#2563EB] transition-colors" title={item.productName}>
                            {item.productName}
                          </p>
                          <span className="text-[11px] text-[#64748B]">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Marketplace & Preço */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#172033] font-mono-numeric">
                            R$ {item.price.toFixed(2).replace('.', ',')}
                          </span>
                          {item.discountPercentage && (
                            <span className="text-[10px] font-bold text-[#2563EB] bg-[#2563EB]/10 px-1.5 rounded">
                              -{item.discountPercentage}%
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-[#64748B] mt-0.5">
                          <span>{item.marketplace}</span>
                          {item.coupon && (
                            <>
                              <span>&bull;</span>
                              <span className="text-[#2563EB] font-mono-numeric">
                                {item.coupon}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Canal Destino */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Radio
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isWhatsApp ? 'text-emerald-700' : 'text-[#2563EB]'
                          }`}
                        />
                        <span className="text-[#CBD5E1] truncate max-w-[180px]">
                          {item.channel}
                        </span>
                      </div>
                    </td>

                    {/* Origem (Automação) */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {item.automationSource ? (
                        <AutomationOriginBadge source={item.automationSource} />
                      ) : (
                        <span className="text-[#64748B]">Manual</span>
                      )}
                    </td>

                    {/* Campanha */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[#94A3B8] truncate max-w-[160px] block">
                        {item.campaignName || 'Disparo Manual'}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {item.dealScore ? (
                        <span className="font-mono-numeric font-bold text-emerald-700 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {item.dealScore}
                        </span>
                      ) : (
                        <span className="text-[#64748B]">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {item.status === 'Publicando' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#2563EB]/15 text-[#2563EB] border border-[#2563EB]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-ping" />
                          Enviando
                        </span>
                      ) : item.status === 'Publicado' ? (
                        <Badge variant="success" size="xs">
                          Publicado
                        </Badge>
                      ) : item.status === 'Falha' ? (
                        <Badge variant="error" size="xs">
                          Falha
                        </Badge>
                      ) : item.status === 'Agendado' ? (
                        <Badge variant="info" size="xs">
                          Agendado
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="xs">
                          Em fila
                        </Badge>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Ver Copy */}
                        <button
                          type="button"
                          onClick={() => onPreviewMessage(item)}
                          className="p-1.5 text-[#2563EB] hover:text-[#2563EB] hover:bg-[#2563EB]/20 rounded-md transition-colors"
                          title="Ver / Editar copy da mensagem"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* Reagendar */}
                        {(item.status === 'Em fila' ||
                          item.status === 'Agendado') && (
                          <button
                            type="button"
                            onClick={() => onReschedule(item)}
                            className="p-1.5 text-[#94A3B8] hover:text-[#172033] hover:bg-[#E2E8F0] rounded-md transition-colors"
                            title="Reagendar horário"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Disparar Agora */}
                        {item.status !== 'Publicado' &&
                          item.status !== 'Publicando' && (
                            <button
                              type="button"
                              onClick={() => onDispatchNow(item)}
                              className="p-1.5 text-emerald-700 hover:text-[#2563EB] hover:bg-emerald-500/20 rounded-md transition-colors"
                              title="Disparar agora"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}

                        {/* Excluir */}
                        {item.status !== 'Publicando' && (
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item)}
                            className="p-1.5 text-[#64748B] hover:text-rose-700 hover:bg-rose-500/10 rounded-md transition-colors"
                            title="Remover da fila"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
