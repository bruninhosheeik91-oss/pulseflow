import React, { useState } from 'react';
import {
  AlertTriangle,
  Loader2,
  MessageCircle,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  Unplug,
  Users,
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  WhatsAppAccount,
  WHATSAPP_STATUS_LABELS,
  WhatsAppConnectionStatus,
} from '../../types/whatsApp';
import { useWhatsAppAccounts } from '../../services/whatsApp/useWhatsAppAccounts';
import { useWhatsAppGroupConfig } from '../../services/whatsApp/groupConfigStore';

const MAX_ACCOUNTS_HINT = 'Suporte a 2 contas simultâneas nesta fase.';

function StatusBadge({
  status,
}: {
  status: WhatsAppConnectionStatus;
}) {
  const tones: Record<WhatsAppConnectionStatus, string> = {
    connected: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    connecting: 'bg-[#1E5EFF]/15 border-[#1E5EFF]/40 text-[#70A1FF]',
    awaiting_qr: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    reconnecting: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    error: 'bg-red-500/15 border-red-500/30 text-red-400',
    disconnected: 'bg-[#121C33] border-[#1E2E50] text-[#8E9BAE]',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium border whitespace-nowrap ${tones[status]}`}
    >
      {WHATSAPP_STATUS_LABELS[status]}
    </span>
  );
}

export const WhatsAppAccountsSection: React.FC = () => {
  const {
    accounts,
    loading,
    error,
    qrBySession,
    syncingSession,
    addAccount,
    connectAccount,
    disconnectAccount,
    syncGroupsFor,
  } = useWhatsAppAccounts();
  const { groups } = useWhatsAppGroupConfig();
  const [busySession, setBusySession] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const groupCountFor = (sessionId: string) =>
    groups.filter((g) => g.sessionId === sessionId).length;

  const handleAdd = async () => {
    setFeedback(null);
    const result = await addAccount();
    if (!result.ok) setFeedback(result.error);
  };

  const handleConnect = async (account: WhatsAppAccount) => {
    setFeedback(null);
    setBusySession(account.sessionId);
    const result = await connectAccount(account.sessionId);
    setBusySession(null);
    if (!result.ok) setFeedback(result.error);
  };

  const handleDisconnect = async (account: WhatsAppAccount) => {
    setFeedback(null);
    setBusySession(account.sessionId);
    const result = await disconnectAccount(account.sessionId);
    setBusySession(null);
    if (!result.ok) setFeedback(result.error);
  };

  const handleSync = async (account: WhatsAppAccount) => {
    setFeedback(null);
    const result = await syncGroupsFor(account.sessionId);
    if (!result.ok) setFeedback(result.error);
  };

  const isMaxed = accounts.length >= 2;

  return (
    <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-5 pb-4 border-b border-[#162442]">
        <div>
          <h2 className="text-sm font-semibold text-[#E6E8EC] tracking-tight">
            Contas conectadas
          </h2>
          <p className="text-xs text-[#8E9BAE] mt-0.5">{MAX_ACCOUNTS_HINT}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void handleAdd()}
          disabled={isMaxed}
          loading={loading}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="text-xs shrink-0"
        >
          Conectar outro WhatsApp
        </Button>
      </div>

      <div className="p-5">
        {feedback && (
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-[11px] text-red-300 leading-relaxed mb-4">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{feedback}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 py-6 justify-center text-xs text-[#8E9BAE]">
            <Loader2 className="w-4 h-4 text-[#00C2FF] animate-spin" />
            Carregando contas...
          </div>
        ) : error ? (
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-[11px] text-red-300">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#14203B] border border-[#1E3057] flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-[#00C2FF]" />
            </div>
            <p className="text-xs text-[#8E9BAE] leading-relaxed">
              Nenhuma conta cadastrada. Conecte o primeiro WhatsApp.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {accounts.map((account) => {
              const connected = account.status === 'connected';
              const busy = busySession === account.sessionId;
              const syncing = syncingSession === account.sessionId;
              const waitingQr = account.status === 'awaiting_qr';
              const qrData = qrBySession[account.sessionId] ?? null;
              return (
                <li
                  key={account.sessionId}
                  className="rounded-lg border border-[#1B2947] bg-[#0A1020] p-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-[#14203B] border border-[#1E3057] flex items-center justify-center shrink-0">
                        <MessageCircle className="w-3.5 h-3.5 text-[#00C2FF]" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-[#E6E8EC] block truncate">
                          {account.name || account.sessionId}
                        </span>
                        <span className="text-[10px] text-[#64748B] font-mono-numeric block truncate">
                          {account.sessionId}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-[#64748B] min-w-0">
                      <Phone className="w-3 h-3 shrink-0" />
                      <span className="truncate font-mono-numeric">
                        {account.number || '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 min-w-0">
                      <Users className="w-3 h-3 text-[#64748B] shrink-0" />
                      <span className="text-[10px] text-[#8E9BAE] whitespace-nowrap">
                        {groupCountFor(account.sessionId)}{' '}
                        {groupCountFor(account.sessionId) === 1
                          ? 'grupo'
                          : 'grupos'}
                      </span>
                    </div>

                    <StatusBadge status={account.status} />

                    <div className="flex items-center gap-1.5 flex-wrap sm:justify-end">
                      {connected ? (
                        <>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => void handleSync(account)}
                            loading={syncing}
                            disabled={busy}
                            leftIcon={
                              <RefreshCw className="w-3 h-3" />
                            }
                            className="text-[11px]"
                          >
                            Sincronizar grupos
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => void handleDisconnect(account)}
                            loading={busy && !syncing}
                            leftIcon={<Unplug className="w-3 h-3" />}
                            className="text-[11px]"
                          >
                            Desconectar
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => void handleConnect(account)}
                          loading={busy}
                          leftIcon={<QrCode className="w-3 h-3" />}
                          className="text-[11px]"
                        >
                          Conectar
                        </Button>
                      )}
                    </div>
                  </div>

                  {waitingQr && (
                    <div className="mt-3 flex flex-col items-center gap-2 pt-3 border-t border-[#16233B] text-center">
                      <div className="flex items-center gap-2 text-[10px] text-[#8E9BAE]">
                        <QrCode className="w-3 h-3 text-amber-400" />
                        Aguardando leitura do QR Code — escaneie no WhatsApp do
                        celular
                      </div>
                      <div className="w-44 h-44 rounded-lg bg-white p-2 flex items-center justify-center">
                        {qrData ? (
                          <img
                            src={qrData}
                            alt={`QR Code da conta ${account.sessionId}`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-[#64748B]">
                            <QrCode className="w-8 h-8" />
                            <span className="text-[10px]">Gerando QR Code...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {isMaxed && (
          <p className="text-[10px] text-[#64748B] pt-3 mt-2 border-t border-[#16233B]">
            Limite de 2 contas atingido por enquanto. Remova uma sessão para
            conectar outra.
          </p>
        )}
      </div>
    </div>
  );
};