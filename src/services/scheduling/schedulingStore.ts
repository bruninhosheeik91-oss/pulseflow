import { useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import {
  ScheduleItem,
  ScheduleStatus,
  scheduleTimestamp,
} from '../../types/scheduling';

/**
 * Store de agendamentos que consome a API REAL do backend
 * (GET/POST/PATCH/DELETE /api/schedules). O backend (Railway) é a fonte da
 * verdade; localStorage NÃO é mais usado como fonte.
 *
 * Dado legado em "domnex.schedules.v1": NÃO é apagado (fica intacto no
 * localStorage), apenas não é lido. Uma migração pode ser feita depois.
 */

const BASE_URL =
  (import.meta.env.VITE_WPP_BACKEND_URL as string | undefined)?.trim() ||
  'http://localhost:3001';

export interface NewScheduleInput {
  title: string;
  accountSessionId: string | null;
  accountName: string;
  groupId: string | null;
  groupName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  message: string;
}

export interface ScheduleUpdateInput {
  title?: string;
  accountName?: string;
  groupName?: string;
  message?: string;
  date?: string;
  time?: string;
  status?: ScheduleStatus;
  errorMessage?: string;
}

/** Formato dos registros vindos do backend. */
interface ApiSchedule {
  id: string;
  title: string;
  sessionId: string;
  accountName: string;
  destinationId: string;
  destinationName: string;
  scheduledAt: string;
  message: string;
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
  executedAt: string | null;
  cancelledAt: string | null;
  errorMessage: string | null;
  sentMessageId: string | null;
  executionStartedAt: string | null;
  deliveryUncertain: boolean;
}

interface StoreState {
  items: ScheduleItem[];
  loading: boolean;
  error: string | null;
}

let state: StoreState = { items: [], loading: true, error: null };
const listeners = new Set<() => void>();
let initPromise: Promise<void> | null = null;

function notify() {
  listeners.forEach((listener) => listener());
}

function commit(next: StoreState) {
  state = next;
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getState(): StoreState {
  return state;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new Error('Não foi possível alcançar o servidor de agendamentos.');
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

// ---------------------------------------------------------------- mappers ---

function localDateParts(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function localTimeParts(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function fromApiSchedule(raw: ApiSchedule): ScheduleItem {
  const scheduled = new Date(raw.scheduledAt);
  return {
    id: raw.id,
    title: raw.title,
    accountSessionId: raw.sessionId || null,
    accountName: raw.accountName,
    groupId: raw.destinationId || null,
    groupName: raw.destinationName,
    date: Number.isFinite(scheduled.getTime())
      ? localDateParts(scheduled)
      : raw.scheduledAt.slice(0, 10),
    time: Number.isFinite(scheduled.getTime())
      ? localTimeParts(scheduled)
      : raw.scheduledAt.slice(11, 16),
    message: raw.message,
    status: raw.status,
    createdAt: raw.createdAt,
    executedAt: raw.executedAt,
    errorMessage: raw.errorMessage,
    sentMessageId: raw.sentMessageId ?? null,
    executionStartedAt: raw.executionStartedAt ?? null,
    deliveryUncertain: raw.deliveryUncertain === true,
  };
}

/** Converte date+time (locais do usuário) em scheduledAt completo ISO. */
function buildScheduledAt(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mi] = time.split(':').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mi || 0, 0, 0);
  if (!Number.isFinite(dt.getTime())) return `${date}T${time}:00`;
  return dt.toISOString();
}

function sortItems(items: ScheduleItem[]): ScheduleItem[] {
  return items.slice().sort((a, b) => scheduleTimestamp(a) - scheduleTimestamp(b));
}

function toCreatePayload(input: NewScheduleInput) {
  return {
    title: input.title,
    sessionId: input.accountSessionId ?? '',
    accountName: input.accountName,
    destinationId: input.groupId ?? '',
    destinationName: input.groupName,
    scheduledAt: buildScheduledAt(input.date, input.time),
    message: input.message,
  };
}

function toPatchPayload(patch: ScheduleUpdateInput) {
  const payload: Record<string, string> = {};
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.accountName !== undefined) payload.accountName = patch.accountName;
  if (patch.groupName !== undefined) payload.destinationName = patch.groupName;
  if (patch.message !== undefined) payload.message = patch.message;
  if (patch.date !== undefined || patch.time !== undefined) {
    // O PATCH só envia scheduledAt quando ambas data e hora vêm juntas.
    payload.scheduledAt = buildScheduledAt(
      patch.date || '',
      patch.time || ''
    );
  }
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.errorMessage !== undefined) payload.errorMessage = patch.errorMessage;
  return payload;
}

function upsertFromApi(next: ApiSchedule): ScheduleItem {
  const mapped = fromApiSchedule(next);
  commit({
    ...state,
    items: sortItems([
      ...state.items.filter((item) => item.id !== mapped.id),
      mapped,
    ]),
    error: null,
  });
  return mapped;
}

// -------------------------------------------------------------- operações ---

export async function refreshSchedules(): Promise<void> {
  try {
    const data = await api<{ ok: boolean; schedules: ApiSchedule[] }>(
      '/api/schedules'
    );
    commit({
      items: sortItems((data.schedules || []).map(fromApiSchedule)),
      loading: false,
      error: null,
    });
  } catch (err) {
    commit({
      ...state,
      loading: false,
      error:
        err instanceof Error
          ? err.message
          : 'Falha ao carregar os agendamentos.',
    });
    throw err;
  }
}

function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = refreshSchedules().catch(() => {
      // estado de erro fica visível na UI; novas tentativas recomeçam limpas
    });
  }
  return initPromise;
}

export function useSchedules(): StoreState {
  useEffect(() => {
    void ensureInitialized().catch(() => {});
  }, []);
  return useSyncExternalStore(subscribe, getState, getState);
}

export async function addSchedule(input: NewScheduleInput): Promise<ScheduleItem> {
  const data = await api<{ ok: boolean; schedule: ApiSchedule }>('/api/schedules', {
    method: 'POST',
    body: JSON.stringify(toCreatePayload(input)),
  });
  return upsertFromApi(data.schedule);
}

export async function updateSchedule(
  id: string,
  patch: ScheduleUpdateInput
): Promise<ScheduleItem> {
  const data = await api<{ ok: boolean; schedule: ApiSchedule }>(
    `/api/schedules/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(toPatchPayload(patch)),
    }
  );
  return upsertFromApi(data.schedule);
}

export async function cancelSchedule(id: string): Promise<ScheduleItem> {
  return updateSchedule(id, { status: 'cancelled' });
}

export async function retrySchedule(id: string): Promise<ScheduleItem> {
  return updateSchedule(id, { status: 'scheduled' });
}

export async function removeSchedule(id: string): Promise<void> {
  await api<{ ok: boolean }>(`/api/schedules/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  commit({
    ...state,
    items: state.items.filter((item) => item.id !== id),
    error: null,
  });
}