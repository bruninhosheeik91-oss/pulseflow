import { useCallback, useEffect, useRef, useState } from 'react';
import {
  WhatsAppAccount,
  WhatsAppGroup,
} from '../../types/whatsApp';
import { getWhatsAppProvider } from './provider';
import { setSyncedGroupsForSession } from './groupConfigStore';

type ActionResult =
  | { ok: true; error?: undefined }
  | { ok: false; error: string };

/**
 * Gerencia múltiplas contas WhatsApp independentes (backend multissessão).
 * Cada sessão tem status e QR próprios; os grupos são sincronizados e
 * etiquetados por sessão no store local, sem misturar contas.
 */
export function useWhatsAppAccounts() {
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrBySession, setQrBySession] = useState<Record<string, string | null>>(
    {}
  );
  const [syncingSession, setSyncingSession] = useState<string | null>(null);
  const [groupsBySession, setGroupsBySession] = useState<
    Record<string, WhatsAppGroup[]>
  >({});

  const refreshAccounts = useCallback(async () => {
    const provider = getWhatsAppProvider();
    if (!provider) {
      setError('Provedor de conexão ainda não configurado.');
      setLoading(false);
      return;
    }
    try {
      const list = await provider.listAccounts();
      setAccounts(list);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao listar as contas.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAccounts();
  }, [refreshAccounts]);

  // Polling: mantém status real de todas as contas e busca o QR apenas das
  // sessões que estão aguardando leitura / conectando.
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const provider = getWhatsAppProvider();
      if (!provider) return;
      try {
        const list = await provider.listAccounts();
        if (cancelled) return;
        setAccounts(list);
        const pending = list.filter(
          (acc) => acc.status === 'awaiting_qr' || acc.status === 'connecting'
        );
        if (pending.length > 0) {
          const patches: Record<string, string | null> = {};
          for (const acc of pending) {
            const qr = await provider.getQrCode(acc.sessionId);
            patches[acc.sessionId] = qr ? qr.imageDataUrl : null;
          }
          if (!cancelled) {
            setQrBySession((prev) => ({ ...prev, ...patches }));
          }
        }
      } catch {
        // servidor indisponível; nova tentativa no próximo ciclo
      }
    };
    void tick();
    const interval = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const addAccount = useCallback(
    async (name?: string): Promise<ActionResult> => {
      const provider = getWhatsAppProvider();
      if (!provider) {
        return { ok: false, error: 'Provedor de conexão não configurado.' };
      }
      try {
        await provider.createAccount(name);
        await refreshAccounts();
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error ? err.message : 'Falha ao adicionar a conta.',
        };
      }
    },
    [refreshAccounts]
  );

  const connectAccount = useCallback(
    async (sessionId: string): Promise<ActionResult> => {
      const provider = getWhatsAppProvider();
      if (!provider) {
        return { ok: false, error: 'Provedor de conexão não configurado.' };
      }
      try {
        await provider.connect(sessionId);
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error ? err.message : 'Falha ao conectar a conta.',
        };
      }
    },
    []
  );

  const disconnectAccount = useCallback(
    async (sessionId: string): Promise<ActionResult> => {
      const provider = getWhatsAppProvider();
      if (!provider) {
        return { ok: false, error: 'Provedor de conexão não configurado.' };
      }
      try {
        await provider.disconnect(sessionId);
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : 'Falha ao desconectar a conta.',
        };
      }
    },
    []
  );

  const syncGroupsFor = useCallback(
    async (sessionId: string): Promise<ActionResult & { count?: number }> => {
      const provider = getWhatsAppProvider();
      if (!provider) {
        return { ok: false, error: 'Provedor de conexão não configurado.' };
      }
      setSyncingSession(sessionId);
      try {
        const groups = await provider.getGroupsForSession(sessionId);
        setSyncedGroupsForSession(groups, sessionId);
        setGroupsBySession((prev) => ({ ...prev, [sessionId]: groups }));
        return { ok: true, count: groups.length };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error ? err.message : 'Falha ao sincronizar grupos.',
        };
      } finally {
        setSyncingSession(null);
      }
    },
    []
  );

  return {
    accounts,
    loading,
    error,
    qrBySession,
    syncingSession,
    groupsBySession,
    refreshAccounts,
    addAccount,
    connectAccount,
    disconnectAccount,
    syncGroupsFor,
  };
}