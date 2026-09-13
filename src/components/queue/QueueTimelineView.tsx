import React from 'react';
import {
  Clock,
  Send,
  Eye,
  Trash2,
  ArrowUp,
  RotateCcw,
  Radio,
  Tag,
  Ticket,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Zap,
  Flame,
} from 'lucide-react';
import { QueueItem } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AutomationOriginBadge } from '../ui/AutomationOriginBadge';

interface QueueTimelineViewProps {
  items: QueueItem[];
  onDispatchNow: (item: QueueItem) => void;
  onPreviewMessage: (item: QueueItem) => void;
  onReschedule: (item: QueueItem) => void;
  onMoveToTop: (item: QueueItem) => void;
  onRemoveItem: (item: QueueItem) => void;
  onRetryItem: (item: QueueItem) => void;
}

export const QueueTimelineView: React.FC<QueueTimelineViewProps> = ({
  items,
  onDispatchNow,
  onPreviewMessage,
  onReschedule,
  onMoveToTop,
  onRemoveItem,
  onRetryItem,
}) => {
  if (items.length === 0) {
    return (
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl py-10 px-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#E2E8F0] border border-[#BFDBFE] flex items-center justify-center text-[#64748B] mx-auto mb-3">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-[#172033]">
          Nenhuma publicação encontrada
        </h3>
        <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
          Não há itens correspondentes aos filtros selecionados ou a fila está vazia no momento.
        </p>
      </div>
    );
  }

  // Group items by category / status state
  const publishingNow = items.filter((i) => i.status === 'Publicando');
  const upcoming = items.filter((i) => i.status === 'Em fila' || i.status === 'Agendado');
  const failures = items.filter((i) => i.status === 'Falha');
  const published = items.filter((i) => i.status === 'Publicado');

  const renderItemCard = (item: QueueItem, index: number) => {
    const isWhatsApp =
      item.channelPlatform === 'WhatsApp' ||
      item.channel.toLowerCase().includes('whatsapp');

    return (
      <div
        key={item.id}
        className={`relative bg-[#FFFFFF] border rounded-xl p-4 transition-all hover:border-[#93C5FD] group ${
          item.status === 'Publicando'
            ? 'border-[#2563EB]/60 shadow-lg shadow-[#2563EB]/10'
            : item.status === 'Falha'
            ? 'border-amber-500/40 bg-amber-500/[0.02]'
            : 'border-[#DCE3EC]'
        }`}
      >
        {/* Top Header: Time, Countdown & Status */}
        <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Time Pill */}
            <span
              className={`text-xs font-mono-numeric font-bold px-2.5 py-0.5 rounded border flex items-center gap-1.5 ${
                item.status === 'Publicando'
                  ? 'bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]/30'
                  : item.status === 'Falha'
                  ? 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                  : item.status === 'Publicado'
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                  : 'bg-[#F8FAFC] text-[#2563EB] border-[#DCE3EC]'
              }`}
            >
              <Clock className="w-3 h-3" />
              {item.time}
            </span>

            {/* Countdown / Estimated time */}
            {item.estimatedInMinutes !== undefined &&
              (item.status === 'Em fila' || item.status === 'Agendado') && (
                <span className="text-[11px] text-[#94A3B8] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#E2E8F0]">
                  {item.estimatedInMinutes === 0
                    ? 'qualquer instante'
                    : `em ~${item.estimatedInMinutes} min`}
                </span>
              )}

            {/* Priority Flag */}
            {item.priority === 'Alta' && item.status !== 'Publicado' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-700 border border-rose-500/20">
                <Flame className="w-2.5 h-2.5 fill-current" />
                Alta Prioridade
              </span>
            )}

            {/* Retries */}
            {item.retries !== undefined && item.retries > 0 && (
              <span className="text-[10px] text-amber-700 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                Tentativa #{item.retries}
              </span>
            )}
          </div>

          {/* Right Status Badge */}
          <div className="shrink-0">
            {item.status === 'Publicando' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2563EB]/15 text-[#2563EB] border border-[#2563EB]/30">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping" />
                Disparando...
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
                Em Fila
              </Badge>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left: Product Thumbnail */}
          <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg bg-[#E2E8F0] border border-[#BFDBFE] overflow-hidden shrink-0 self-start">
            <img
              src={item.productImage}
              alt={item.productName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            {item.discountPercentage && (
              <span className="absolute bottom-1 right-1 bg-[#2563EB] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                -{item.discountPercentage}%
              </span>
            )}
          </div>

          {/* Center: Details & Metadata */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title & Category */}
            <div>
              <h4 className="text-sm font-semibold text-[#172033] group-hover:text-[#2563EB] transition-colors line-clamp-1">
                {item.productName}
              </h4>
              <div className="flex items-center gap-2 text-xs text-[#94A3B8] mt-1 flex-wrap">
                {item.marketplace && (
                  <span className="font-medium text-[#2563EB]">
                    {item.marketplace}
                  </span>
                )}
                <span>&bull;</span>
                <span>{item.category}</span>
                {item.dealScore && (
                  <>
                    <span>&bull;</span>
                    <span className="font-mono-numeric font-bold text-emerald-700 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      Score {item.dealScore}
                    </span>
                  </>
                )}
                {item.automationSource && (
                  <>
                    <span>&bull;</span>
                    <AutomationOriginBadge source={item.automationSource} />
                  </>
                )}
              </div>
            </div>

            {/* Price line */}
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold font-mono-numeric text-[#172033]">
                R$ {item.price.toFixed(2).replace('.', ',')}
              </span>
              {item.originalPrice && (
                <span className="text-xs line-through text-[#64748B] font-mono-numeric">
                  R$ {item.originalPrice.toFixed(2).replace('.', ',')}
                </span>
              )}
              {item.coupon && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono-numeric text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded border border-[#2563EB]/20">
                  <Ticket className="w-3 h-3" />
                  Cupom: {item.coupon}
                </span>
              )}
            </div>

            {/* Channel & Campaign tags */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Channel */}
              <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-md text-[#CBD5E1]">
                <Radio
                  className={`w-3.5 h-3.5 ${
                    isWhatsApp ? 'text-emerald-700' : 'text-[#2563EB]'
                  }`}
                />
                <span className="truncate max-w-[200px] font-medium">
                  {item.channel}
                </span>
              </div>

              {/* Campaign */}
              {item.campaignName && (
                <div className="flex items-center gap-1 text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-1 rounded-md">
                  <Tag className="w-3 h-3 text-[#2563EB]" />
                  <span className="truncate max-w-[180px]">
                    {item.campaignName}
                  </span>
                </div>
              )}
            </div>

            {/* Failure notice */}
            {item.status === 'Falha' && item.errorMessage && (
              <div className="p-2 bg-amber-500/10 border border-amber-500/25 rounded-md flex items-start gap-2 text-xs text-amber-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                <span className="leading-relaxed">{item.errorMessage}</span>
              </div>
            )}

            {/* Published stats */}
            {item.status === 'Publicado' && item.publishedAt && (
              <div className="flex items-center gap-3 text-xs text-emerald-700/90 pt-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {item.publishedAt}
                </span>
                {item.clicksCount !== undefined && (
                  <span className="font-mono-numeric font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    +{item.clicksCount} cliques gerados
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="mt-3.5 pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
          {/* Left Action: Preview Copy */}
          <button
            type="button"
            onClick={() => onPreviewMessage(item)}
            className="flex items-center gap-1.5 text-xs text-[#2563EB] hover:text-[#38D2FF] bg-[#2563EB]/10 hover:bg-[#2563EB]/20 px-2.5 py-1.5 rounded-lg border border-[#2563EB]/25 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ver / Editar Mensagem</span>
          </button>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 flex-wrap ml-auto">
            {/* If Failure -> Retry Now */}
            {item.status === 'Falha' && (
              <button
                type="button"
                onClick={() => onRetryItem(item)}
                className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reprocessar Agora</span>
              </button>
            )}

            {/* If Upcoming -> Move To Top */}
            {(item.status === 'Em fila' || item.status === 'Agendado') && index > 0 && (
              <button
                type="button"
                onClick={() => onMoveToTop(item)}
                className="p-1.5 text-[#94A3B8] hover:text-[#2563EB] bg-[#F1F5F9] border border-[#DCE3EC] rounded-lg transition-colors"
                title="Priorizar / Mover para o topo da fila"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            )}

            {/* If Upcoming -> Reschedule Time */}
            {(item.status === 'Em fila' || item.status === 'Agendado') && (
              <button
                type="button"
                onClick={() => onReschedule(item)}
                className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#172033] bg-[#F1F5F9] border border-[#DCE3EC] px-2.5 py-1.5 rounded-lg transition-colors"
                title="Reagendar horário ou intervalo"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Reagendar</span>
              </button>
            )}

            {/* If Upcoming or Failure -> Dispatch Now */}
            {item.status !== 'Publicado' && item.status !== 'Publicando' && (
              <Button
                variant="primary"
                size="xs"
                onClick={() => onDispatchNow(item)}
                className="flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                <span>Disparar Agora</span>
              </Button>
            )}

            {/* Remove from queue */}
            {item.status !== 'Publicando' && (
              <button
                type="button"
                onClick={() => onRemoveItem(item)}
                className="p-1.5 text-[#64748B] hover:text-rose-700 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Remover da fila"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. In-flight / Publishing Now Section */}
      {publishingNow.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping" />
            <span>Processando Disparo Imediato ({publishingNow.length})</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {publishingNow.map((item, idx) => renderItemCard(item, idx))}
          </div>
        </div>
      )}

      {/* 2. Failures requiring attention */}
      {failures.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Requer Atenção / Retentativa ({failures.length})</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {failures.map((item, idx) => renderItemCard(item, idx))}
          </div>
        </div>
      )}

      {/* 3. Upcoming Scheduled Queue */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Próximas Postagens Programadas ({upcoming.length})</span>
            </div>
            <span className="text-xs text-[#64748B]">
              Cadência ordenada por prioridade e delay anti-flood
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {upcoming.map((item, idx) => renderItemCard(item, idx))}
          </div>
        </div>
      )}

      {/* 4. Concluded / Published History */}
      {published.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Concluídas Hoje ({published.length})</span>
          </div>
          <div className="grid grid-cols-1 gap-3 opacity-90">
            {published.map((item, idx) => renderItemCard(item, idx))}
          </div>
        </div>
      )}
    </div>
  );
};
