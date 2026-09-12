import {
  WhatsAppAccount,
  WhatsAppConnectionStatus,
  WhatsAppGroup,
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

export class WppConnectProvider implements WhatsAppProvider {
  readonly id = 'wppconnect';
  readonly label = 'WPPConnect';

  private readonly baseUrl = getBaseUrl();

  async connect(): Promise<void> {
    await apiFetch(this.baseUrl, '/api/whatsapp/connect', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async disconnect(): Promise<void> {
    await apiFetch(this.baseUrl, '/api/whatsapp/disconnect', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getConnectionStatus(): Promise<WhatsAppConnectionStatus> {
    const data = await apiFetch<{ status: WhatsAppConnectionStatus }>(
      this.baseUrl,
      '/api/whatsapp/status'
    );
    return data.status;
  }

  async getQrCode(): Promise<WhatsAppQrPayload | null> {
    try {
      const data = await apiFetch<{ qr: string | null }>(
        this.baseUrl,
        '/api/whatsapp/qr'
      );
      if (!data || !data.qr) return null;
      return { imageDataUrl: data.qr, expiresAt: Date.now() + 60000 };
    } catch {
      return null;
    }
  }

  async getGroups(): Promise<WhatsAppGroup[]> {
    const data = await apiFetch<{
      groups: WhatsAppGroup[];
    }>(this.baseUrl, '/api/whatsapp/groups');
    return (data.groups || [])
      .map((group) => ({
        id: group.id,
        name: typeof group.name === 'string' && group.name.trim() ? group.name : null,
        participantCount:
          typeof group.participantCount === 'number' ? group.participantCount : null,
        isGroup: true as const,
      }))
      .filter((group) => Boolean(group.id && group.id.trim()));
  }

  async getAccount(): Promise<WhatsAppAccount | null> {
    try {
      const data = await apiFetch<{
        account?: {
          number?: string | null;
          name?: string | null;
          connectionStatus?: WhatsAppConnectionStatus;
          lastSyncAt?: string | null;
        };
      }>(this.baseUrl, '/api/whatsapp/account');
      if (!data || !data.account) return null;
      return {
        number: data.account.number || '',
        name: data.account.name || '',
        connectionStatus: data.account.connectionStatus || 'connected',
        lastSyncAt: data.account.lastSyncAt || null,
      };
    } catch {
      // Dados de conta são opcionais e nunca derrubam o fluxo de conexão.
      return null;
    }
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