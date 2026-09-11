import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageCircle,
  QrCode,
  X,
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  WhatsAppConnectionStatus,
  WHATSAPP_STATUS_LABELS,
} from '../../types/whatsApp';

interface WhatsAppConnectModalProps {
  isOpen: boolean;
  status: WhatsAppConnectionStatus;
  qrData: string | null;
  errorMessage: string | null;
  onClose: () => void;
  onRetry: () => void;
}

const QR_TIMEOUT_HINT =
  'O QR Code expira após alguns minutos. Gere um novo QR Code se necessário.';

export const WhatsAppConnectModal: React.FC<WhatsAppConnectModalProps> = ({
  isOpen,
  status,
  qrData,
  errorMessage,
  onClose,
  onRetry,
}) => {
  if (!isOpen) return null;

  const isLoading =
    status === 'connecting' || status === 'reconnecting';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md bg-[#0E1628] border border-[#22355F] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#162442]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E5EFF]/15 border border-[#1E5EFF]/30 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-[#00C2FF]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#E6E8EC] tracking-tight">
                Conectar WhatsApp
              </h3>
              <p className="text-[10px] text-[#8E9BAE]">
                {WHATSAPP_STATUS_LABELS[status]}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#8E9BAE] hover:text-[#E6E8EC] hover:bg-[#14203B] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {isLoading && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
              <div>
                <p className="text-sm font-medium text-[#E6E8EC]">
                  {status === 'reconnecting'
                    ? 'Reconectando...'
                    : 'Conectando...'}
                </p>
                <p className="text-xs text-[#8E9BAE] mt-1">
                  Estabelecendo sessão com o provedor de conexão.
                </p>
              </div>
            </div>
          )}

          {status === 'awaiting_qr' && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div className="relative w-52 h-52 rounded-lg bg-white p-3 flex items-center justify-center">
                {qrData ? (
                  <img
                    src={qrData}
                    alt="QR Code de conexão do WhatsApp"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[#64748B]">
                    <QrCode className="w-10 h-10" />
                    <span className="text-[11px]">Gerando QR Code...</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-[#E6E8EC]">
                  Aguardando leitura do QR Code
                </p>
                <p className="text-xs text-[#8E9BAE] mt-1 max-w-xs leading-relaxed">
                  Abra o WhatsApp no seu celular, toque em{' '}
                  <span className="text-[#00C2FF] font-medium">
                    Aparelhos conectados
                  </span>{' '}
                  e escaneie o código. {QR_TIMEOUT_HINT}
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#E6E8EC]">
                  Não foi possível conectar
                </p>
                <p className="text-xs text-[#8E9BAE] mt-1 leading-relaxed">
                  {errorMessage ??
                    'Ocorreu um erro durante a conexão. Tente novamente.'}
                </p>
              </div>
              <div className="flex items-center gap-2 w-full justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-xs font-medium"
                >
                  Fechar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onRetry}
                  className="text-xs font-medium"
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          )}

          {status === 'connected' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#E6E8EC]">
                  Conectado com sucesso
                </p>
                <p className="text-xs text-[#8E9BAE] mt-1">
                  Sua conta está pronta para a operação.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={onClose}
                className="text-xs font-medium"
              >
                Concluir
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};