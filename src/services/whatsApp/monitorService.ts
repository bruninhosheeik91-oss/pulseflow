export interface MonitorServerStatus {
  ok: boolean;
  session: string;
  connected: boolean;
  enabled: boolean;
  parentGroupId: string | null;
  childGroupIds: string[];
  lastMessageAt: string | null;
  lastMessageId: string | null;
  lastSendAt: string | null;
  lastSendMessageId: string | null;
  lastError: string | null;
}

const BASE_URL =
  (import.meta.env.VITE_WPP_BACKEND_URL as string | undefined)?.trim() ||
  'http://localhost:3001';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
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
      const body = (await res.json()) as { error?: string };
      if (body && body.error) message = body.error;
    } catch {
      // mantém a mensagem padrão
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

export function getMonitorStatus(sessionId?: string): Promise<MonitorServerStatus> {
  const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
  return api<MonitorServerStatus>(`/api/monitor/status${query}`);
}

export function updateMonitorServerConfig(config: {
  sessionId?: string;
  parentGroupId: string | null;
  childGroupIds: string[];
}): Promise<MonitorServerStatus> {
  return api<MonitorServerStatus>('/api/monitor', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: config.sessionId,
      parentGroupId: config.parentGroupId,
      childGroupIds: config.childGroupIds,
    }),
  });
}