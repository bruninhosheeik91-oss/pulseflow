import { useCallback, useEffect, useRef, useState } from 'react';
import {
  WhatsAppAccount,
  WhatsAppConnectionStatus,
} from '../../types/whatsApp';
import {
  getWhatsAppProvider,
  WhatsAppProviderNotConfiguredError,
} from './provider';
import { setSyncedGroups } from './groupConfigStore';

const PROVIDER_NOT_CONFIGURED_MESSAGE =
  'Provedor de conexão ainda não configurado.';
const SYNC_RETRY_AFTER_MS = 30_000;

/**
 * Controla a máquina de estados da conexão WhatsApp.
 *
 * Estados: Desconectado / Conectando / Aguardando leitura do QR Code /
 * Conectado / Reconectando / Erro.
 *
 * Sem um provedor registrado, o fluxo permanece honesto: qualquer tentativa
 * de conectar resulta no estado "erro" com a mensagem de provedor não
 * configurado. Nenhum QR Code ou dado fictício é gerado.
 */
export function useWhatsAppConnection() {
  const [status, setStatus] = useState<WhatsAppConnectionStatus>(
    'disconnected'
  );
  const [qrData, setQrData] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [account, setAccount] = useState<WhatsAppAccount | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const lastSyncFailureAt = useRef(0);
  const syncAttemptId = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const notConfigured = useCallback(() => {
    setStatus('error');
    setErrorMessage(PROVIDER_NOT_CONFIGURED_MESSAGE);
  }, []);

  const loadAccount = useCallback(async () => {
    const provider = getWhatsAppProvider();
    if (!provider) return;
    try {
      const acc = await provider.getAccount();
      if (mountedRef.current && acc) setAccount(acc);
    } catch {
      // conta é opcional; mantém o estado atual
    }
  }, []);

  // Ao montar a página (inclusive F5), detecta a sessão persistida existente:
  // se o backend já estiver conectado, mostra "Conta conectada" sem novo QR.
  useEffect(() => {
    let cancelled = false;
    const provider = getWhatsAppProvider();
    if (!provider) return;
    provider
      .getConnectionStatus()
      .then((next) => {
        if (cancelled) return;
        setQrData(null);
        setStatus(next);
        if (next === 'connected') {
          void loadAccount();
        }
      })
      .catch(() => {
        // backend indisponível; mantém o estado inicial
      });
    return () => {
      cancelled = true;
    };
  }, [loadAccount]);

  // Polling: enquanto `connecting`, `awaiting_qr` ou `reconnecting`, consulta o
  // provedor em busca do QR Code real e do novo status (intervalo de 2s).
  useEffect(() => {
    if (
      status !== 'connecting' &&
      status !== 'awaiting_qr' &&
      status !== 'reconnecting'
    ) {
      return;
    }

    const provider = getWhatsAppProvider();
    if (!provider) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const [connection, qr] = await Promise.all([
          provider.getConnectionStatus(),
          provider.getQrCode(),
        ]);
        if (cancelled) return;
        setStatus(connection);
        if (connection === 'connected') {
          setQrData(null);
          setErrorMessage(null);
          void loadAccount();
        } else if (qr) {
          setQrData(qr.imageDataUrl);
        }
      } catch {
        // mantém o estado atual; nova tentativa no próximo ciclo
      }
    };

    tick();
    const interval = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [status, loadAccount]);

  const connect = useCallback(async () => {
    const provider = getWhatsAppProvider();

    if (!provider) {
      notConfigured();
      return;
    }

    setStatus('connecting');
    setQrData(null);
    setErrorMessage(null);

    try {
      await provider.connect();
    } catch (err) {
      if (err instanceof WhatsAppProviderNotConfiguredError) {
        if (mountedRef.current) {
          setStatus('error');
          setErrorMessage(PROVIDER_NOT_CONFIGURED_MESSAGE);
        }
        return;
      }
      // POST falhou/timeout: a sessão pode ter sido autenticada mesmo assim.
      // Reconsulta o status antes de decidir que houve erro.
    }

    try {
      const next = await provider.getConnectionStatus();
      if (!mountedRef.current) return;
      if (next === 'connected') {
        setStatus('connected');
        setQrData(null);
        void loadAccount();
      } else if (
        next === 'connecting' ||
        next === 'awaiting_qr' ||
        next === 'reconnecting'
      ) {
        setStatus(next);
      } else {
        setStatus('error');
        setErrorMessage('Não foi possível conectar ao WhatsApp.');
      }
    } catch {
      if (!mountedRef.current) return;
      setStatus('error');
      setErrorMessage('Não foi possível conectar ao WhatsApp.');
    }
  }, [notConfigured, loadAccount]);

  const reconnect = useCallback(async () => {
    const provider = getWhatsAppProvider();

    if (!provider) {
      notConfigured();
      return;
    }

    setStatus('reconnecting');
    setQrData(null);
    setErrorMessage(null);

    try {
      await provider.connect();
    } catch (err) {
      if (err instanceof WhatsAppProviderNotConfiguredError) {
        if (mountedRef.current) {
          setStatus('error');
          setErrorMessage(PROVIDER_NOT_CONFIGURED_MESSAGE);
        }
        return;
      }
    }

    try {
      const next = await provider.getConnectionStatus();
      if (!mountedRef.current) return;
      if (next === 'connected') {
        setStatus('connected');
        setQrData(null);
        void loadAccount();
      } else if (
        next === 'connecting' ||
        next === 'awaiting_qr' ||
        next === 'reconnecting'
      ) {
        setStatus(next);
      } else {
        setStatus('error');
        setErrorMessage('Não foi possível reconectar ao WhatsApp.');
      }
    } catch {
      if (!mountedRef.current) return;
      setStatus('error');
      setErrorMessage('Não foi possível reconectar ao WhatsApp.');
    }
  }, [notConfigured, loadAccount]);

  const recover = useCallback(async () => {
    const provider = getWhatsAppProvider();

    if (!provider) {
      notConfigured();
      return;
    }

    setStatus('connecting');
    setQrData(null);
    setErrorMessage(null);

    try {
      await provider.recoverQr();
    } catch (err) {
      if (!mountedRef.current) return;
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Falha ao gerar novo QR.'
      );
      return;
    }

    try {
      const next = await provider.getConnectionStatus();
      if (!mountedRef.current) return;
      if (next === 'connected') {
        setStatus('connected');
        setQrData(null);
        void loadAccount();
      } else if (
        next === 'connecting' ||
        next === 'awaiting_qr' ||
        next === 'reconnecting'
      ) {
        setStatus(next);
      } else {
        setStatus('error');
        setErrorMessage('Não foi possível gerar o novo QR.');
      }
    } catch {
      if (!mountedRef.current) return;
      setStatus('error');
      setErrorMessage('Não foi possível gerar o novo QR.');
    }
  }, [notConfigured, loadAccount]);

  const disconnect = useCallback(async () => {
    const provider = getWhatsAppProvider();

    if (provider) {
      try {
        await provider.disconnect();
      } catch {
        // Sem provedor real, a desconexão é tratada como estado local.
      }
    }

    setStatus('disconnected');
    setQrData(null);
    setErrorMessage(null);
    setAccount(null);
    setGroupsError(null);
    setSyncedGroups([]);
  }, []);

  const syncGroups = useCallback(async () => {
    const provider = getWhatsAppProvider();

    if (!provider) {
      const error = 'Provedor de conexão ainda não configurado.';
      setGroupsError(error);
      lastSyncFailureAt.current = Date.now();
      return { ok: false as const, error };
    }

    const attempt = ++syncAttemptId.current;
    setIsSyncing(true);
    setGroupsError(null);
    try {
      const result = await provider.getGroups();
      if (!mountedRef.current || attempt !== syncAttemptId.current) {
        return { ok: true as const };
      }
      if (Array.isArray(result) && result.length > 0) {
        setSyncedGroups(result);
        lastSyncFailureAt.current = 0;
        return { ok: true as const };
      }
      // Backend respondeu com zero grupos e runtimeTimeout=false: sincronização
      // VÁLIDA (a conta tem zero grupos de verdade). Isso NÃO é falha — o
      // timeout real lança GroupSyncTimeoutError e cai no catch abaixo.
      // Preserva os grupos persistidos (nunca apaga configuração monitor).
      if (Array.isArray(result)) {
        setGroupsError(null);
        lastSyncFailureAt.current = 0;
        return { ok: true as const };
      }
    } catch (err) {
      if (!mountedRef.current || attempt !== syncAttemptId.current) {
        return { ok: false as const, error: 'desmounted' };
      }
      const error =
        err instanceof Error
          ? err.message
          : 'Falha ao sincronizar os grupos.';
      setGroupsError(error);
      lastSyncFailureAt.current = Date.now();
      return { ok: false as const, error };
    } finally {
      if (mountedRef.current && attempt === syncAttemptId.current) {
        setIsSyncing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (status !== 'connected') return;
    // Evita re-trigger imediato após falha: espera SYNC_RETRY_AFTER_MS.
    const sinceFailure = Date.now() - lastSyncFailureAt.current;
    if (lastSyncFailureAt.current > 0 && sinceFailure < SYNC_RETRY_AFTER_MS) {
      const delay = SYNC_RETRY_AFTER_MS - sinceFailure;
      const timer = setTimeout(() => {
        if (mountedRef.current) void syncGroups();
      }, delay);
      return () => clearTimeout(timer);
    }
    void syncGroups();
  }, [status, syncGroups]);

  const sendMessage = useCallback(
    async (to: string, text: string) => {
      const provider = getWhatsAppProvider();
      if (!provider) {
        return { ok: false as const, error: PROVIDER_NOT_CONFIGURED_MESSAGE };
      }
      try {
        await provider.sendMessage(to, text);
        return { ok: true as const };
      } catch (err) {
        return {
          ok: false as const,
          error: err instanceof Error ? err.message : 'Falha no envio.',
        };
      }
    },
    []
  );

  return {
    status,
    qrData,
    errorMessage,
    account,
    isSyncing,
    groupsError,
    connect,
    reconnect,
    recover,
    disconnect,
    syncGroups,
    sendMessage,
  };
}