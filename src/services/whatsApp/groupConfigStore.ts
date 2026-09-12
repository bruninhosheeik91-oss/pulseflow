import { useSyncExternalStore } from 'react';
import { WhatsAppGroup } from '../../types/whatsApp';

const STORAGE_KEY = 'domnex.whatsapp.groups.v1';

export interface WhatsAppGroupConfig {
  groups: WhatsAppGroup[];
  syncedAt: string | null;
  parentGroupId: string | null;
  childGroupIds: string[];
}

const EMPTY_CONFIG: WhatsAppGroupConfig = {
  groups: [],
  syncedAt: null,
  parentGroupId: null,
  childGroupIds: [],
};

function isWhatsAppGroup(value: unknown): value is WhatsAppGroup {
  if (!value || typeof value !== 'object') return false;
  const g = value as Record<string, unknown>;
  return (
    typeof g.id === 'string' &&
    Boolean(g.id) &&
    (g.name === null || typeof g.name === 'string') &&
    (g.participantCount === null || typeof g.participantCount === 'number') &&
    g.isGroup === true
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
    const childGroupIds = Array.isArray(parsed.childGroupIds)
      ? parsed.childGroupIds.filter(
          (id): id is string => typeof id === 'string' && ids.has(id) && id !== parentGroupId
        )
      : [];
    return {
      groups,
      syncedAt: typeof parsed.syncedAt === 'string' ? parsed.syncedAt : null,
      parentGroupId,
      childGroupIds,
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
}

export function getGroupConfig(): WhatsAppGroupConfig {
  return state;
}

export function setSyncedGroups(
  groups: WhatsAppGroup[],
  syncedAt: string = new Date().toISOString()
) {
  const valid = groups.filter((g) => g && typeof g.id === 'string' && Boolean(g.id));
  const ids = new Set(valid.map((g) => g.id));
  const parentGroupId =
    state.parentGroupId && ids.has(state.parentGroupId) ? state.parentGroupId : null;
  const childGroupIds = state.childGroupIds.filter(
    (id) => ids.has(id) && id !== parentGroupId
  );
  commit({ groups: valid, syncedAt, parentGroupId, childGroupIds });
}

export function setParentGroup(id: string | null) {
  if (id === null) {
    commit({ ...state, parentGroupId: null });
    return;
  }
  if (!state.groups.some((g) => g.id === id)) return;
  commit({
    ...state,
    parentGroupId: id,
    childGroupIds: state.childGroupIds.filter((child) => child !== id),
  });
}

export function addChildGroup(id: string) {
  if (!state.groups.some((g) => g.id === id)) return;
  if (id === state.parentGroupId) return;
  if (state.childGroupIds.includes(id)) return;
  commit({ ...state, childGroupIds: [...state.childGroupIds, id] });
}

export function removeChildGroup(id: string) {
  commit({ ...state, childGroupIds: state.childGroupIds.filter((child) => child !== id) });
}

export function replaceChildGroups(ids: string[]) {
  const unique = Array.from(new Set(ids));
  const valid = unique.filter(
    (id) => id !== state.parentGroupId && state.groups.some((g) => g.id === id)
  );
  commit({ ...state, childGroupIds: valid });
}

export function clearGroupSelection() {
  commit({ ...state, parentGroupId: null, childGroupIds: [] });
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