import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { WhatsAppAccount, WhatsAppGroup } from '../../types/whatsApp';
import { getWhatsAppProvider } from './provider';
import { GroupSyncTimeoutError } from './wppConnectProvider';
import {
  setSyncedGroupsForSession,
  clearGroupsForSession,
} from './groupConfigStore';

type ActionResult =
  | { ok: true; error?: undefined }
  | { ok: false; error: string };

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ]);
}

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
  const [syncTimeoutBySession, setSyncTimeoutBySession] = useState<
    Record<string, boolean>
  >({});
  const [warmingUpBySession, setWarmingUpBySession] = useState<
    Record<string, boolean>
  >({});
  const [syncInProgressBySession, setSyncInProgressBySession] = useState<
    Record<string, boolean>
  >({});

  const clearFlagBySession = useCallback(
    (
      setter: Dispatch<SetStateAction<Record<string, boolean>>>,
      sessionId: string
    ) => {
      setter((prev) => {
        if (prev[sessionId] === undefined) return prev;
        const next = { ...prev };
        delete next[sessionId];
        return next;
      });
    },
    []
  );

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

  // Polling: mantém o status real de todas as contas e busca o QR APENAS das
  // sessões que estão aguardando leitura / conectando.
  //
  // Isolamento: a lista é o valor mais importante (atualizado primeiro) e cada
  // QR é buscado de forma independente com timeout próprio. Uma conta com QR
  // lento/expirando NÃO bloqueia a atualização das demais nem congela a tela.
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const provider = getWhatsAppProvider();
      if (!provider) return;
      try {
        const list = await provider.listAccounts();
        if (cancelled) return;
        setAccounts(list);
        setError(null);

        const pending = list.filter(
          (acc) =>
            acc.status === 'awaiting_qr' || acc.status === 'connecting'
        );
        if (pending.length === 0) return;

        const results = await Promise.allSettled(
          pending.map(async (acc) => {
            const qrPayload = await withTimeout(
              provider.getQrCode(acc.sessionId),
              4000
            );
            return { sessionId: acc.sessionId, qr: qrPayload };
          })
        );
        if (cancelled) return;

        const patches: Record<string, string | null> = {};
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            patches[result.value.sessionId] = result.value.qr
              ? result.value.qr.imageDataUrl
              : null;
          }
          // Rejeições (timeout/transitórias) são ignoradas: o QR anterior é
          // mantido e a próxima execução do taxa tenta de novo.
        }
        if (Object.keys(patches).length > 0) {
          setQrBySession((prev) => ({ ...prev, ...patches }));
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
    async (displayName: string): Promise<ActionResult> => {
      const provider = getWhatsAppProvider();
      if (!provider) {
        return { ok: false, error: 'Provedor de conexão não configurado.' };
      }
      try {
        await provider.createAccount(displayName);
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

  const recoverAccount = useCallback(
    async (sessionId: string): Promise<ActionResult> => {
      const provider = getWhatsAppProvider();
      if (!provider) {
        return { ok: false, error: 'Provedor de conexão não configurado.' };
      }
      try {
        await provider.recoverQr(sessionId);
        setQrBySession((prev) => ({ ...prev, [sessionId]: null }));
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error ? err.message : 'Falha ao gerar novo QR.',
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

  const removeAccount = useCallback(
    async (sessionId: string): Promise<ActionResult> => {
      const provider = getWhatsAppProvider();
      if (!provider) {
        return { ok: false, error: 'Provedor de conexão não configurado.' };
      }
      try {
        await provider.removeAccount(sessionId);
        clearGroupsForSession(sessionId);
        setQrBySession((prev) => {
          const next = { ...prev };
          delete next[sessionId];
          return next;
        });
        setGroupsBySession((prev) => {
          const next = { ...prev };
          delete next[sessionId];
          return next;
        });
        setSyncTimeoutBySession((prev) => {
          const next = { ...prev };
          delete next[sessionId];
          return next;
        });
        await refreshAccounts();
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error ? err.message : 'Falha ao remover a conta.',
        };
      }
    },
    [refreshAccounts]
  );

  const renameAccount = useCallback(
    async (sessionId: string, displayName: string): Promise<ActionResult> => {
      const provider = getWhatsAppProvider();
      if (!provider) {
        return { ok: false, error: 'Provedor de conexão não configurado.' };
      }
      try {
        await provider.renameAccount(sessionId, displayName);
        await refreshAccounts();
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error ? err.message : 'Falha ao renomear a conta.',
        };
      }
    },
    [refreshAccounts]
  );

  const sendMessage = useCallback(
    async (
      sessionId: string,
      to: string,
      text: string
    ): Promise<ActionResult> => {
      const provider = getWhatsAppProvider();
      if (!provider) {
        return { ok: false, error: 'Provedor de conexão não configurado.' };
      }
      try {
        await provider.sendMessage(to, text, sessionId);
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Falha no envio.',
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
        const result =
          typeof provider.getGroupsSyncResult === 'function'
            ? await provider.getGroupsSyncResult(sessionId)
            : {
                groups: await provider.getGroupsForSession(sessionId),
                warmingUp: false,
                syncInProgress: false,
                cached: false,
                retryAfterMs: 0,
                syncedAt: null,
              };

        if (result.warmingUp) {
          // Sessão recém-conectada (MAIN) em warm-up: NÃO é erro e NÃO é
          // runtime morto. A UI mostra "finalizando sincronização".
          setWarmingUpBySession((prev) => ({ ...prev, [sessionId]: true }));
          clearFlagBySession(setSyncInProgressBySession, sessionId);
          clearFlagBySession(setSyncTimeoutBySession, sessionId);
          return { ok: true };
        }

        if (result.syncInProgress) {
          // Já existe operação WPP real pendente: NÃO duplicar request.
          setSyncInProgressBySession((prev) => ({ ...prev, [sessionId]: true }));
          clearFlagBySession(setWarmingUpBySession, sessionId);
          clearFlagBySession(setSyncTimeoutBySession, sessionId);
          return { ok: true };
        }

        const groups = result.groups;
        // Sincronização VÁLIDA (mesmo com zero grupos): atualiza e limpa
        // qualquer estado de falha/warm-up/sincronização anterior.
        setSyncedGroupsForSession(
          groups,
          sessionId,
          result.syncedAt ?? undefined
        );
        setGroupsBySession((prev) => ({ ...prev, [sessionId]: groups }));
        clearFlagBySession(setSyncTimeoutBySession, sessionId);
        clearFlagBySession(setWarmingUpBySession, sessionId);
        clearFlagBySession(setSyncInProgressBySession, sessionId);
        return { ok: true, count: groups.length };
      } catch (err) {
        if (err instanceof GroupSyncTimeoutError) {
          setSyncTimeoutBySession((prev) => ({ ...prev, [sessionId]: true }));
          clearFlagBySession(setWarmingUpBySession, sessionId);
          clearFlagBySession(setSyncInProgressBySession, sessionId);
          return {
            ok: false,
            error: 'Não foi possível sincronizar os grupos.',
          };
        }
        return {
          ok: false,
          error:
            err instanceof Error ? err.message : 'Falha ao sincronizar grupos.',
        };
      } finally {
        setSyncingSession(null);
      }
    },
    [clearFlagBySession]
  );

  return {
    accounts,
    loading,
    error,
    qrBySession,
    syncingSession,
    groupsBySession,
    syncTimeoutBySession,
    warmingUpBySession,
    syncInProgressBySession,
    refreshAccounts,
    addAccount,
    connectAccount,
    disconnectAccount,
    recoverAccount,
    syncGroupsFor,
    removeAccount,
    renameAccount,
    sendMessage,
  };
}