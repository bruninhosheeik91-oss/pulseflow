import React, { useState } from 'react';
import {
  X,
  Clock,
  Send,
  RotateCcw,
  Copy,
  Check,
  Radio,
  Store,
  Tag,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { HistoryDispatchItem } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface HistoryDetailModalProps {
  isOpen: boolean;
  item: HistoryDispatchItem | null;
  onClose: () => void;
  onRetry: (item: HistoryDispatchItem) => void;
}

export const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({
  isOpen,
  item,
  onClose,
  onRetry,
}) => {
  if (!item) return null;

  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(item.copyText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(item.affiliateUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isWhatsApp = item.channelPlatform === 'WhatsApp';
  const isFailed = item.status === 'Falha';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalhes do Disparo & Auditoria"
      subtitle={`Registro ID: ${item.id} &bull; Enviado em ${item.dispatchedAt}`}
      maxWidth="xl"
    >
      <div className="space-y-4 text-xs">
        {/* Top Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <div>
            <span className="text-[#64748B] text-[11px]">Canal de Destino:</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isWhatsApp ? 'bg-emerald-400' : 'bg-sky-400'
                }`}
              />
              <span className="font-semibold text-white truncate">
                {item.channel}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[#64748B] text-[11px]">Marketplace:</span>
            <p className="font-semibold text-[#2563EB] mt-0.5">
              {item.marketplace}
            </p>
          </div>

          <div>
            <span className="text-[#64748B] text-[11px]">Status da Entrega:</span>
            <div className="mt-0.5">
              {item.status === 'Entregue' ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Entregue (200 OK)
                </span>
              ) : item.status === 'Falha' ? (
                <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Falha de Envio
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[#2563EB] font-bold">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Re-enviado
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[#64748B] text-[11px]">Deal Score:</span>
            <p className="font-mono-numeric font-bold text-white mt-0.5">
              {item.dealScore}/100 pts
            </p>
          </div>
        </div>

        {/* Failure alert banner if failed */}
        {isFailed && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-700">
            <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Falha registrada no envio:</p>
              <p className="text-[11px] text-[#CBD5E1] mt-0.5">
                {item.errorMessage ||
                  'Instância de disparo não conseguiu confirmar a entrega no gateway.'}
              </p>
            </div>
          </div>
        )}

        {/* 2-Column Layout: Message Simulator + Telemetry & Conversion */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Left Column: Simulated Chat Balloon (7 cols) */}
          <div className="md:col-span-7 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#CBD5E1]">
                Prévia da Mensagem Entregue
              </span>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-[11px] text-[#2563EB] hover:underline flex items-center gap-1"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-700" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>
            </div>

            {/* Chat Device Simulator */}
            <div
              className={`p-3 rounded-xl border ${
                isWhatsApp
                  ? 'bg-[#F8FAFC] border-[#F1F5F9]'
                  : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}
            >
              {/* Balloon */}
              <div
                className={`rounded-xl p-3 border shadow-md ${
                  isWhatsApp
                    ? 'bg-[#F1F5F9] border-[#E2E8F0] text-[#E9EDEF]'
                    : 'bg-[#E2E8F0] border-[#E2E8F0] text-[#E4ECF2]'
                }`}
              >
                {/* Product Image */}
                {item.productImage && (
                  <div className="relative mb-2.5 rounded-lg overflow-hidden bg-black/40 border border-white/5">
                    <img
                      src={item.productImage}
                      alt=""
                      className="w-full h-44 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white">
                      {item.marketplace}
                    </div>
                  </div>
                )}

                {/* Message Text with formatting preview */}
                <div className="whitespace-pre-line font-sans text-xs leading-relaxed break-words">
                  {item.copyText}
                </div>

                {/* Simulated timestamp inside balloon */}
                <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] text-white/50">
                  <span>{item.timeStr}</span>
                  {item.status === 'Entregue' && (
                    <span className="text-[#53BDEB] font-bold">✓✓</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Telemetry & Conversion Metrics (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            {/* Conversion card */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-2.5">
              <span className="font-semibold text-white block">
                Resultados Financeiros
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-[#FFFFFF] rounded-lg border border-[#DCE3EC]">
                  <span className="text-[#64748B] text-[10px]">Cliques:</span>
                  <p className="font-mono-numeric font-bold text-white text-base mt-0.5">
                    {item.clicks.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-[#FFFFFF] rounded-lg border border-[#DCE3EC]">
                  <span className="text-[#64748B] text-[10px]">Pedidos:</span>
                  <p className="font-mono-numeric font-bold text-indigo-700 text-base mt-0.5">
                    {item.orders}
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-gradient-to-r from-[#FFFFFF] to-[#EFF6FF] rounded-lg border border-[#93C5FD]">
                <span className="text-[#64748B] text-[10px]">Comissão Atribuída:</span>
                <p className="font-mono-numeric font-bold text-emerald-700 text-lg mt-0.5">
                  R$ {item.commission.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>

            {/* Technical Telemetry Card */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-white font-semibold">
                <Cpu className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Telemetria do Gateway</span>
              </div>

              <div className="space-y-1.5 text-[11px] text-[#94A3B8]">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1">
                  <span>Instância:</span>
                  <span className="text-white font-mono">{item.instanceName || '—'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1">
                  <span>Latência HTTP:</span>
                  <span className="text-[#64748B] font-mono">—</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1">
                  <span>Espaçamento Anti-Flood:</span>
                  <span className="text-white font-mono">—</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>ID do Canal:</span>
                  <span className="text-white font-mono">{item.channelId}</span>
                </div>
              </div>
            </div>

            {/* Link Copy */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-1.5">
              <span className="font-medium text-[#CBD5E1] block">
                Link de Afiliado com Rastreamento
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={item.affiliateUrl}
                  className="w-full bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg px-2.5 py-1 text-[11px] text-[#94A3B8] font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-1.5 bg-[#E2E8F0] hover:bg-[#BFDBFE] border border-[#2563EB]/40 rounded-lg text-[#93C5FD] transition-colors shrink-0"
                  title="Copiar Link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar Auditoria
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onRetry(item);
                onClose();
              }}
              className="shadow-lg shadow-[#2563EB]/15 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Re-enviar Oferta ao Canal</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
