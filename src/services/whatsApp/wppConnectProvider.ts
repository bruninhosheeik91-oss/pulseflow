import {
  WhatsAppAccount,
  WhatsAppConnectionStatus,
  WhatsAppGroup,
  DOMNEX_DEFAULT_SESSION_ID,
} from '../../types/whatsApp';
import {
  WhatsAppProvider,
  WhatsAppQrPayload,
  GroupsSyncResult,
  CachedGroupsSnapshot,
} from './provider';

const DEFAULT_BASE_URL = 'http://localhost:3001';

function getBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_WPP_BACKEND_URL as string | undefined;
  return (fromEnv && fromEnv.trim()) || DEFAULT_BASE_URL;
}

interface ApiErrorBody {
  error?: string;
}

/**
 * Lançado quando o backend responde runtimeTimeout=true (todas as estratégias
 * de listagem falharam e não há cache). Permite ao frontend distinguir uma
 * sincronização que FALHOU de um resultado válido com zero grupos.
 */
export class GroupSyncTimeoutError extends Error {
  readonly runtimeTimeout = true;
  constructor() {
    super('Falha ao sincronizar grupos');
    this.name = 'GroupSyncTimeoutError';
  }
}

async function apiFetch<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new Error('Não foi possível alcançar o servidor de conexão.');
  }

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  // Sempre ler o JSON — mesmo em erros HTTP — para extrair mensagem
  // controlada do backend (ex.: runtimeTimeout, WPP_RUNTIME_TIMEOUT).
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (body as ApiErrorBody | undefined)?.error || `Erro HTTP ${res.status}`;
    throw new Error(message);
  }

  return body as T;
}

// Monta o caminho da API: com sessão explícita, ou o caminho legado (conta
// principal) quando o sessionId não é informado.
function sessionPath(sessionId: string | undefined, suffix: string): string {
  if (sessionId && sessionId !== DOMNEX_DEFAULT_SESSION_ID) {
    return `/api/whatsapp/${encodeURIComponent(sessionId)}${suffix}`;
  }
  return `/api/whatsapp${suffix}`;
}

function normalizeStatus(raw: unknown): WhatsAppConnectionStatus {
  const value = String(raw || '');
  if (
    ['disconnected', 'connecting', 'awaiting_qr', 'connected', 'reconnecting', 'error'].includes(
      value
    )
  ) {
    return value as WhatsAppConnectionStatus;
  }
  return 'disconnected';
}

function normalizeGroup(group: WhatsAppGroup, sessionId: string): WhatsAppGroup {
  // Tolerância a payloads legados com participantCount (backend antigo).
  const legacy = group as WhatsAppGroup & {
    participantCount?: number | null;
  };
  const memberCount =
    typeof group.memberCount === 'number'
      ? group.memberCount
      : typeof legacy.participantCount === 'number'
      ? legacy.participantCount
      : null;
  return {
    id: group.id,
    name:
      typeof group.name === 'string' && group.name.trim() ? group.name : null,
    memberCount,
    isGroup: true as const,
    whatsappAccountId: sessionId,
    sessionId,
  };
}

function normalizeAccount(raw: {
  id?: string;
  sessionId?: string;
  number?: string | null;
  displayName?: string | null;
  name?: string | null;
  status?: string;
  connectionStatus?: string;
  queued?: boolean;
  connectedAt?: string | null;
  lastSyncAt?: string | null;
}): WhatsAppAccount {
  const sessionId = (raw.sessionId || raw.id || '').trim() || '<unknown>';
  const status = normalizeStatus(raw.status ?? raw.connectionStatus);
  const displayName = raw.displayName || raw.name || '';
  return {
    id: sessionId,
    sessionId,
    number: raw.number || '',
    displayName,
    name: displayName,
    status,
    connectionStatus: status,
    queued: raw.queued === true,
    connectedAt: raw.connectedAt ?? null,
    lastSyncAt: raw.lastSyncAt ?? null,
  };
}

export class WppConnectProvider implements WhatsAppProvider {
  readonly id = 'wppconnect';
  readonly label = 'WPPConnect';

  private readonly baseUrl = getBaseUrl();

  async connect(sessionId?: string): Promise<void> {
    await apiFetch(this.baseUrl, sessionPath(sessionId, '/connect'), {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async disconnect(sessionId?: string): Promise<void> {
    await apiFetch(this.baseUrl, sessionPath(sessionId, '/disconnect'), {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async recoverQr(sessionId?: string): Promise<void> {
    await apiFetch(this.baseUrl, sessionPath(sessionId, '/recover-qr'), {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getConnectionStatus(sessionId?: string): Promise<WhatsAppConnectionStatus> {
    const data = await apiFetch<{ status: string; connected: boolean }>(
      this.baseUrl,
      sessionPath(sessionId, '/status')
    );
    return normalizeStatus(data.status || (data.connected ? 'connected' : undefined));
  }

  async getQrCode(sessionId?: string): Promise<WhatsAppQrPayload | null> {
    try {
      const data = await apiFetch<{ qr: string | null }>(
        this.baseUrl,
        sessionPath(sessionId, '/qr')
      );
      if (!data || !data.qr) return null;
      return { imageDataUrl: data.qr, expiresAt: Date.now() + 60000 };
    } catch {
      return null;
    }
  }

  async getGroups(sessionId?: string): Promise<WhatsAppGroup[]> {
    const result = await this.getGroupsSyncResult(sessionId);
    return result.groups;
  }

  async getGroupsSyncResult(sessionId?: string): Promise<GroupsSyncResult> {
    const effective = sessionId || DOMNEX_DEFAULT_SESSION_ID;
    const data = await apiFetch<{
      ok?: boolean;
      groups?: WhatsAppGroup[];
      runtimeTimeout?: boolean;
      cached?: boolean;
      warmingUp?: boolean;
      syncInProgress?: boolean;
      retryAfterMs?: number;
      syncedAt?: string | null;
    }>(this.baseUrl, sessionPath(sessionId, '/groups'));
    // Backend responde runtimeTimeout=true apenas quando a sincronização FALHOU
    // (timeout real, após warm-up) e não há cache. Isso NÃO é "0 grupos".
    if (data.runtimeTimeout) {
      throw new GroupSyncTimeoutError();
    }
    const groups = (data.groups || [])
      .map((group) => normalizeGroup(group, effective))
      .filter((group) => Boolean(group.id && group.id.trim()));
    return {
      groups,
      warmingUp: Boolean(data.warmingUp),
      syncInProgress: Boolean(data.syncInProgress),
      cached: Boolean(data.cached),
      retryAfterMs: Number(data.retryAfterMs) || 0,
      syncedAt: typeof data.syncedAt === 'string' ? data.syncedAt : null,
    };
  }

  /**
   * Hidrata a Dashboard com os grupos já conhecidos pelo SERVIDOR, sem tocar
   * no WPPConnect. Retorna apenas as contas que possuem snapshot em cache.
   */
  async getCachedGroups(): Promise<CachedGroupsSnapshot[]> {
    const data = await apiFetch<{
      ok?: boolean;
      sessions?: Array<{
        sessionId?: string;
        groups?: WhatsAppGroup[];
        syncedAt?: string | null;
      }>;
    }>(this.baseUrl, '/api/whatsapp/groups/cached');

    const snapshots: CachedGroupsSnapshot[] = [];
    for (const entry of data.sessions || []) {
      const sessionId = (entry.sessionId || '').trim();
      if (!sessionId) continue;
      const groups = (entry.groups || [])
        .map((group) => normalizeGroup(group, sessionId))
        .filter((group) => Boolean(group.id && group.id.trim()));
      if (groups.length === 0) continue;
      snapshots.push({
        sessionId,
        groups,
        syncedAt: typeof entry.syncedAt === 'string' ? entry.syncedAt : null,
      });
    }
    return snapshots;
  }

  async getGroupsForSession(sessionId: string): Promise<WhatsAppGroup[]> {
    return this.getGroups(sessionId);
  }

  async getAccount(sessionId?: string): Promise<WhatsAppAccount | null> {
    try {
      const data = await apiFetch<{
        account?: {
          id?: string;
          sessionId?: string;
          number?: string | null;
          displayName?: string | null;
          name?: string | null;
          connectionStatus?: string;
          status?: string;
          connectedAt?: string | null;
          lastSyncAt?: string | null;
        };
      }>(this.baseUrl, sessionPath(sessionId, '/account'));
      if (!data || !data.account) return null;
      return normalizeAccount(data.account);
    } catch {
      // Dados de conta são opcionais e nunca derrubam o fluxo de conexão.
      return null;
    }
  }

  async listAccounts(): Promise<WhatsAppAccount[]> {
    const data = await apiFetch<{
      accounts?: Array<{
        id?: string;
        sessionId?: string;
        number?: string | null;
        displayName?: string | null;
        name?: string | null;
        status?: string;
        connectedAt?: string | null;
        lastSyncAt?: string | null;
      }>;
    }>(this.baseUrl, '/api/whatsapp/accounts');
    return (data.accounts || []).map(normalizeAccount);
  }

  async createAccount(displayName: string): Promise<WhatsAppAccount> {
    const data = await apiFetch<{ account: WhatsAppAccount }>(
      this.baseUrl,
      '/api/whatsapp/accounts',
      {
        method: 'POST',
        body: JSON.stringify({ name: displayName }),
      }
    );
    return normalizeAccount(data.account);
  }

  async renameAccount(
    sessionId: string,
    displayName: string
  ): Promise<WhatsAppAccount> {
    const data = await apiFetch<{ account: WhatsAppAccount }>(
      this.baseUrl,
      `/api/whatsapp/${encodeURIComponent(sessionId)}/account`,
      {
        method: 'PATCH',
        body: JSON.stringify({ displayName }),
      }
    );
    return normalizeAccount(data.account);
  }

  async removeAccount(sessionId: string): Promise<void> {
    await apiFetch(
      this.baseUrl,
      `/api/whatsapp/${encodeURIComponent(sessionId)}/account`,
      { method: 'DELETE' }
    );
  }

  async sendMessage(to: string, text: string, sessionId?: string): Promise<void> {
    await apiFetch(this.baseUrl, sessionPath(sessionId, '/send'), {
      method: 'POST',
      body: JSON.stringify({ groupId: to, message: text }),
    });
  }
}

export function createWppConnectProvider(): WppConnectProvider {
  return new WppConnectProvider();
}
