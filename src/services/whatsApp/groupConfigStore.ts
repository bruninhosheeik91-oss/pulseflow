import { useSyncExternalStore } from 'react';
import {
  WhatsAppGroup,
  DOMNEX_DEFAULT_SESSION_ID,
} from '../../types/whatsApp';
import { updateMonitorServerConfig } from './monitorService';

const STORAGE_KEY = 'domnex.whatsapp.groups.v1';
export const DEFAULT_CHANNEL_ANTIFLOOD_SECONDS = 30;

export interface WhatsAppGroupConfig {
  groups: WhatsAppGroup[];
  syncedAt: string | null;
  parentGroupId: string | null;
  parentSessionId: string | null;
  childGroupIds: string[];
  childGroupDelays: Record<string, number>;
}

const EMPTY_CONFIG: WhatsAppGroupConfig = {
  groups: [],
  syncedAt: null,
  parentGroupId: null,
  parentSessionId: null,
  childGroupIds: [],
  childGroupDelays: {},
};

function normalizeDelay(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_CHANNEL_ANTIFLOOD_SECONDS;
  return Math.min(3600, Math.max(0, Math.round(number)));
}

function isWhatsAppGroup(value: unknown): value is WhatsAppGroup {
  if (!value || typeof value !== 'object') return false;
  const g = value as Record<string, unknown>;
  return (
    typeof g.id === 'string' &&
    Boolean(g.id) &&
    (g.name === null || typeof g.name === 'string') &&
    (g.participantCount === null || typeof g.participantCount === 'number') &&
    g.isGroup === true &&
    (g.whatsappAccountId === null || typeof g.whatsappAccountId === 'string') &&
    (g.sessionId === null || typeof g.sessionId === 'string')
  );
}

function readFromStorage(): WhatsAppGroupConfig {
  if (typeof window === 'undefined') return EMPTY_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_CONFIG;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const groups = Array.isArray(parsed.groups)
      ? parsed.groups.filter(isWhatsAppGroup)
      : [];
    const ids = new Set(groups.map((g) => g.id));
    const parentGroupId =
      typeof parsed.parentGroupId === 'string' && ids.has(parsed.parentGroupId)
        ? parsed.parentGroupId
        : null;
    const parentGroup = groups.find((g) => g.id === parentGroupId) ?? null;
    const parentSessionId =
      typeof parsed.parentSessionId === 'string'
        ? parsed.parentSessionId
        : parentGroup?.sessionId ?? null;
    const childGroupIds = Array.isArray(parsed.childGroupIds)
      ? parsed.childGroupIds.filter(
          (id): id is string =>
            typeof id === 'string' &&
            ids.has(id) &&
            id !== parentGroupId &&
            (!parentSessionId
              ? Boolean(groups.find((g) => g.id === id)?.sessionId === null)
              : groups.find((g) => g.id === id)?.sessionId === parentSessionId)
        )
      : [];

    const storedDelays =
      parsed.childGroupDelays && typeof parsed.childGroupDelays === 'object'
        ? (parsed.childGroupDelays as Record<string, unknown>)
        : {};
    const childGroupDelays: Record<string, number> = {};
    for (const group of groups) {
      childGroupDelays[group.id] = normalizeDelay(storedDelays[group.id]);
    }

    return {
      groups,
      syncedAt: typeof parsed.syncedAt === 'string' ? parsed.syncedAt : null,
      parentGroupId,
      parentSessionId,
      childGroupIds,
      childGroupDelays,
    };
  } catch {
    return EMPTY_CONFIG;
  }
}

let state: WhatsAppGroupConfig = readFromStorage();
const listeners = new Set<() => void>();

function persist() {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // armazenamento indisponível: mantém apenas o estado em memória
  }
}

function commit(next: WhatsAppGroupConfig) {
  state = next;
  persist();
  listeners.forEach((listener) => listener());
  void syncMonitorServerConfig();
}

function activeChildDelays(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const id of state.childGroupIds) {
    result[id] = normalizeDelay(state.childGroupDelays[id]);
  }
  return result;
}

// Espelha Grupo Mãe, destinos e anti-flood no backend real do monitor.
function syncMonitorServerConfig() {
  try {
    void updateMonitorServerConfig({
      sessionId: state.parentSessionId ?? DOMNEX_DEFAULT_SESSION_ID,
      parentGroupId: state.parentGroupId,
      childGroupIds: state.childGroupIds,
      childGroupDelays: activeChildDelays(),
    }).catch(() => {
      // backend indisponível; sincronização refeita na próxima alteração
    });
  } catch {
    // nenhuma alteração de seleção pode ser bloqueada por falha de rede
  }
}

export function getGroupConfig(): WhatsAppGroupConfig {
  return state;
}

export function getChildGroupDelay(id: string): number {
  return normalizeDelay(state.childGroupDelays[id]);
}

export function setChildGroupDelay(id: string, seconds: number) {
  if (!state.groups.some((group) => group.id === id)) return;
  commit({
    ...state,
    childGroupDelays: {
      ...state.childGroupDelays,
      [id]: normalizeDelay(seconds),
    },
  });
}

function tagGroupsWithSession(
  groups: WhatsAppGroup[],
  sessionId: string
): WhatsAppGroup[] {
  return groups
    .filter((g) => g && typeof g.id === 'string' && Boolean(g.id))
    .map((g) => ({
      ...g,
      whatsappAccountId: sessionId,
      sessionId,
    }));
}

export function setSyncedGroupsForSession(
  groups: WhatsAppGroup[],
  sessionId: string,
  syncedAt: string = new Date().toISOString()
) {
  const valid = tagGroupsWithSession(groups, sessionId);
  // Resultado vazio (WPP travado/timeout/sem grupos) NUNCA apaga grupos já
  // persistidos nem a configuração monitor (Grupo Mãe/Filho). A sincronização
  // falhar não pode limpar a seleção do usuário.
  if (valid.length === 0) return;
  const others = state.groups.filter((g) => g.sessionId !== sessionId);
  const nextGroups = [...others, ...valid];
  const ids = new Set(nextGroups.map((g) => g.id));
  const parentGroupId =
    state.parentGroupId && ids.has(state.parentGroupId)
      ? state.parentGroupId
      : null;
  const parentGroup = nextGroups.find((g) => g.id === parentGroupId) ?? null;
  const parentSessionId = parentGroup?.sessionId ?? null;
  const childGroupIds = state.childGroupIds.filter(
    (id) =>
      ids.has(id) &&
      id !== parentGroupId &&
      nextGroups.find((g) => g.id === id)?.sessionId === parentSessionId
  );
  const childGroupDelays: Record<string, number> = {};
  for (const group of nextGroups) {
    childGroupDelays[group.id] = normalizeDelay(state.childGroupDelays[group.id]);
  }
  commit({
    groups: nextGroups,
    syncedAt,
    parentGroupId,
    parentSessionId,
    childGroupIds,
    childGroupDelays,
  });
}

export function setSyncedGroups(
  groups: WhatsAppGroup[],
  syncedAt: string = new Date().toISOString()
) {
  setSyncedGroupsForSession(groups, DOMNEX_DEFAULT_SESSION_ID, syncedAt);
}

export function setParentGroup(id: string | null) {
  if (id === null) {
    commit({ ...state, parentGroupId: null, parentSessionId: null });
    return;
  }
  const group = state.groups.find((g) => g.id === id);
  if (!group) return;
  const sessionId = group.sessionId ?? DOMNEX_DEFAULT_SESSION_ID;
  commit({
    ...state,
    parentGroupId: id,
    parentSessionId: sessionId,
    childGroupIds: state.childGroupIds.filter(
      (child) =>
        child !== id &&
        state.groups.find((g) => g.id === child)?.sessionId === sessionId
    ),
  });
}

export function addChildGroup(id: string) {
  const group = state.groups.find((g) => g.id === id);
  if (!group) return;
  if (id === state.parentGroupId) return;
  if (!state.parentSessionId || group.sessionId !== state.parentSessionId) return;
  if (state.childGroupIds.includes(id)) return;
  commit({
    ...state,
    childGroupIds: [...state.childGroupIds, id],
    childGroupDelays: {
      ...state.childGroupDelays,
      [id]: normalizeDelay(state.childGroupDelays[id]),
    },
  });
}

export function removeChildGroup(id: string) {
  commit({
    ...state,
    childGroupIds: state.childGroupIds.filter((child) => child !== id),
  });
}

export function replaceChildGroups(ids: string[]) {
  const unique = Array.from(new Set(ids));
  const valid = unique.filter(
    (id) =>
      id !== state.parentGroupId &&
      state.groups.some(
        (g) => g.id === id && g.sessionId === state.parentSessionId
      )
  );
  commit({ ...state, childGroupIds: valid });
}

export function clearGroupSelection() {
  commit({
    ...state,
    parentGroupId: null,
    parentSessionId: null,
    childGroupIds: [],
  });
}

export function clearGroupsForSession(sessionId: string) {
  const removedIds = new Set(
    state.groups.filter((g) => g.sessionId === sessionId).map((g) => g.id)
  );
  const remaining = state.groups.filter((g) => g.sessionId !== sessionId);
  const ids = new Set(remaining.map((g) => g.id));
  const childGroupDelays = Object.fromEntries(
    Object.entries(state.childGroupDelays).filter(([id]) => !removedIds.has(id))
  );
  commit({
    groups: remaining,
    syncedAt: state.syncedAt,
    parentGroupId:
      state.parentGroupId && ids.has(state.parentGroupId)
        ? state.parentGroupId
        : null,
    parentSessionId:
      state.parentSessionId &&
      remaining.some((g) => g.sessionId === state.parentSessionId)
        ? state.parentSessionId
        : null,
    childGroupIds: state.childGroupIds.filter((id) => ids.has(id)),
    childGroupDelays,
  });
}

export function subscribeGroupConfig(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useWhatsAppGroupConfig(): WhatsAppGroupConfig {
  return useSyncExternalStore(subscribeGroupConfig, getGroupConfig);
}
