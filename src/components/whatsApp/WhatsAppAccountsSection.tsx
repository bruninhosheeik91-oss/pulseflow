import React, { useState } from 'react';
import {
  AlertTriangle,
  Loader2,
  MessageCircle,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  Trash2,
  Unplug,
  Users,
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  WhatsAppAccount,
  WHATSAPP_STATUS_LABELS,
  WhatsAppConnectionStatus,
  DOMNEX_DEFAULT_SESSION_ID,
} from '../../types/whatsApp';
import { useWhatsAppAccounts } from '../../services/whatsApp/useWhatsAppAccounts';
import { useWhatsAppGroupConfig } from '../../services/whatsApp/groupConfigStore';

function StatusBadge({
  status,
}: {
  status: WhatsAppConnectionStatus;
}) {
  const tones: Record<WhatsAppConnectionStatus, string> = {
    connected: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700',
    connecting: 'bg-[#2563EB]/15 border-[#2563EB]/40 text-[#2563EB]',
    awaiting_qr: 'bg-amber-500/15 border-amber-500/30 text-amber-700',
    reconnecting: 'bg-amber-500/15 border-amber-500/30 text-amber-700',
    error: 'bg-red-500/15 border-red-500/30 text-red-700',
    disconnected: 'bg-[#F1F5F9] border-[#BFDBFE] text-[#64748B]',
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
    recoverAccount,
    syncGroupsFor,
    removeAccount,
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

  const handleRecover = async (account: WhatsAppAccount) => {
    setFeedback(null);
    setBusySession(account.sessionId);
    const result = await recoverAccount(account.sessionId);
    setBusySession(null);
    if (!result.ok) setFeedback(result.error);
  };

  const handleSync = async (account: WhatsAppAccount) => {
    setFeedback(null);
    const result = await syncGroupsFor(account.sessionId);
    if (!result.ok) setFeedback(result.error);
  };

  const handleRemove = async (account: WhatsAppAccount) => {
    setFeedback(null);
    if (
      !window.confirm(
        `Remover a sessão "${account.name || account.sessionId}"?\nOs tokens e dados serão apagados permanentemente.`
      )
    ) {
      return;
    }
    setBusySession(account.sessionId);
    const result = await removeAccount(account.sessionId);
    setBusySession(null);
    if (!result.ok) setFeedback(result.error);
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-5 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h2 className="text-sm font-semibold text-[#172033] tracking-tight">
            Contas conectadas
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Múltiplas contas WhatsApp independentes — cada uma com QR, status e
            grupos próprios.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void handleAdd()}
          loading={loading}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="text-xs shrink-0"
        >
          Conectar outro WhatsApp
        </Button>
      </div>

      <div className="p-5">
        {feedback && (
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-[11px] text-red-700 leading-relaxed mb-4">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{feedback}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 py-6 justify-center text-xs text-[#64748B]">
            <Loader2 className="w-4 h-4 text-[#2563EB] animate-spin" />
            Carregando contas...
          </div>
        ) : error ? (
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-[11px] text-red-700">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#E2E8F0] border border-[#BFDBFE] flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-[#2563EB]" />
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
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
                  className="rounded-lg border border-[#DCE3EC] bg-[#F8FAFC] p-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-[#E2E8F0] border border-[#BFDBFE] flex items-center justify-center shrink-0">
                        <MessageCircle className="w-3.5 h-3.5 text-[#2563EB]" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-[#172033] block truncate">
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
                      <span className="text-[10px] text-[#64748B] whitespace-nowrap">
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
                        <div className="flex items-center gap-1.5 flex-wrap sm:justify-end">
                          <Button
                            variant={account.status === 'error' ? 'secondary' : 'primary'}
                            size="xs"
                            onClick={() =>
                              account.status === 'error'
                                ? void handleRecover(account)
                                : void handleConnect(account)
                            }
                            loading={busy}
                            leftIcon={
                              account.status === 'error' ? (
                                <RefreshCw className="w-3 h-3" />
                              ) : (
                                <QrCode className="w-3 h-3" />
                              )
                            }
                            className="text-[11px]"
                          >
                            {account.status === 'error'
                              ? 'Tentar novamente'
                              : 'Conectar'}
                          </Button>
                        </div>
                      )}

                      {account.sessionId !== DOMNEX_DEFAULT_SESSION_ID && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => void handleRemove(account)}
                          loading={busy && !syncing && connected}
                          title="Remover sessão"
                          className="text-red-700/70 hover:text-red-700 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {waitingQr && (
                    <div className="mt-3 flex flex-col items-center gap-2 pt-3 border-t border-[#E2E8F0] text-center">
                      <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
                        <QrCode className="w-3 h-3 text-amber-700" />
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
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="text-[10px]">Buscando QR Code...</span>
                            <span className="text-[9px] text-[#56637A]">
                              Se demorar, use Tentar novamente
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {account.status === 'error' && (
                    <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-[11px] text-red-700 leading-relaxed">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        Falha na conexão: nenhum QR real foi gerado ou o WhatsApp
                        não conectou. Use <b className="text-red-200">Tentar novamente</b>{' '}
                        para reiniciar a sessão.
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};