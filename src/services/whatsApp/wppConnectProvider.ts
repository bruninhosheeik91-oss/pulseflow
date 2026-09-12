import {
  WhatsAppAccount,
  WhatsAppConnectionStatus,
  WhatsAppGroup,
  DOMNEX_DEFAULT_SESSION_ID,
} from '../../types/whatsApp';
import { WhatsAppProvider, WhatsAppQrPayload } from './provider';

const DEFAULT_BASE_URL = 'http://localhost:3001';

function getBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_WPP_BACKEND_URL as string | undefined;
  return (fromEnv && fromEnv.trim()) || DEFAULT_BASE_URL;
}

interface ApiErrorBody {
  error?: string;
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

  if (!res.ok) {
    let message = `Erro HTTP ${res.status}`;
    try {
      const body = (await res.json()) as ApiErrorBody;
      if (body && body.error) message = body.error;
    } catch {
      // mantém a mensagem padrão
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
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
  return {
    id: group.id,
    name:
      typeof group.name === 'string' && group.name.trim() ? group.name : null,
    participantCount:
      typeof group.participantCount === 'number' ? group.participantCount : null,
    isGroup: true as const,
    whatsappAccountId: sessionId,
    sessionId,
  };
}

function normalizeAccount(raw: {
  id?: string;
  sessionId?: string;
  number?: string | null;
  name?: string | null;
  status?: string;
  connectionStatus?: string;
  connectedAt?: string | null;
  lastSyncAt?: string | null;
}): WhatsAppAccount {
  const sessionId = raw.sessionId || raw.id || DOMNEX_DEFAULT_SESSION_ID;
  const status = normalizeStatus(raw.status ?? raw.connectionStatus);
  return {
    id: sessionId,
    sessionId,
    number: raw.number || '',
    name: raw.name || '',
    status,
    connectionStatus: status,
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
    const effective = sessionId || DOMNEX_DEFAULT_SESSION_ID;
    const data = await apiFetch<{
      groups: WhatsAppGroup[];
    }>(this.baseUrl, sessionPath(sessionId, '/groups'));
    return (data.groups || [])
      .map((group) => normalizeGroup(group, effective))
      .filter((group) => Boolean(group.id && group.id.trim()));
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
        name?: string | null;
        status?: string;
        connectedAt?: string | null;
        lastSyncAt?: string | null;
      }>;
    }>(this.baseUrl, '/api/whatsapp/accounts');
    return (data.accounts || []).map(normalizeAccount);
  }

  async createAccount(name?: string): Promise<WhatsAppAccount> {
    const data = await apiFetch<{ account: WhatsAppAccount }>(
      this.baseUrl,
      '/api/whatsapp/accounts',
      {
        method: 'POST',
        body: JSON.stringify({ name: name || undefined }),
      }
    );
    return normalizeAccount(data.account);
  }

  async sendMessage(to: string, text: string): Promise<void> {
    await apiFetch(this.baseUrl, '/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ groupId: to, message: text }),
    });
  }
}

export function createWppConnectProvider(): WppConnectProvider {
  return new WppConnectProvider();
}